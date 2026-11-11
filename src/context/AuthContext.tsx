/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Company, Branch, Department, Team } from '../types/index.ts';

interface AuthContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  availableUsers: User[];
  users: User[];
  departments: Department[];
  teams: Team[];
  company: Company | null;
  branches: Branch[];
  currentBranchId: string;
  setCurrentBranchId: (id: string) => void;
  isCustomerPortal: boolean;
  setIsCustomerPortal: (val: boolean) => void;
  refreshMeta: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr-sarah-mensah',
    name: 'Sarah Mensah',
    email: 'sarah.mensah@zemifix.com',
    phone: '+233 24 100 0001',
    role: 'Admin',
    branchId: 'br-accra-hq',
    departmentId: 'dept-engineering',
    accessScope: 'Company',
    teamIds: [],
    approvalLimit: 100000,
    isActive: true,
    locale: 'en-US',
    version: 1,
  });
  const [company, setCompany] = useState<Company | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentBranchId, setCurrentBranchId] = useState<string>('br-accra-hq');
  const [isCustomerPortal, setIsCustomerPortal] = useState<boolean>(false);

  const fetchMeta = async () => {
    try {
      const res = await fetch('/api/v1/meta', {
        headers: { 'x-user-id': currentUser.id },
      });
      if (res.ok) {
        const data = await res.json();
        setAvailableUsers(data.users || []);
        setCompany(data.company || null);
        setBranches(data.branches || []);
        setDepartments(data.departments || []);
        setTeams(data.teams || []);
        if (data.currentUser && (!currentUser || currentUser.id === 'usr-sarah-mensah')) {
          setCurrentUser(data.currentUser);
        }
      }
    } catch (e) {
      console.warn('Failed to fetch meta:', e);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        availableUsers,
        users: availableUsers,
        departments,
        teams,
        company,
        branches,
        currentBranchId,
        setCurrentBranchId,
        isCustomerPortal,
        setIsCustomerPortal,
        refreshMeta: fetchMeta,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
