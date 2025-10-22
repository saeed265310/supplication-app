import { useState, useEffect, useCallback } from 'react';
import type { UserData, SupplicationGroup, Supplication } from '../types';

export const useUserData = (username: string | null) => {
  const [userData, setUserData] = useState<UserData>({ groups: [] });
  const [loading, setLoading] = useState(true);
  
  const storageKey = username ? `supplication_app_data_${username}` : null;

  const loadData = useCallback(() => {
    if (storageKey) {
      const rawData = localStorage.getItem(storageKey);
      if (rawData) {
        setUserData(JSON.parse(rawData));
      } else {
        // Initialize if no data exists for user
        const initialData = { groups: [] };
        localStorage.setItem(storageKey, JSON.stringify(initialData));
        setUserData(initialData);
      }
    }
    setLoading(false);
  }, [storageKey]);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [username, loadData]);

  const saveData = (data: UserData) => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(data));
      setUserData(data);
    }
  };

  const addGroup = (name: string) => {
    const newGroup: SupplicationGroup = {
      id: Date.now().toString(),
      name,
      supplications: [],
    };
    const newData = { ...userData, groups: [...userData.groups, newGroup] };
    saveData(newData);
  };
  
  const deleteGroup = (groupId: string) => {
    const updatedGroups = userData.groups.filter(g => g.id !== groupId);
    saveData({ ...userData, groups: updatedGroups });
  };
  
  const addSupplication = (groupId: string, text: string, target: number) => {
    const newSupplication: Supplication = {
      id: Date.now().toString(),
      text,
      target,
      currentCount: 0,
    };

    const updatedGroups = userData.groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          supplications: [...group.supplications, newSupplication]
        };
      }
      return group;
    });

    saveData({ ...userData, groups: updatedGroups });
  };

  const updateSupplication = (groupId: string, supplicationId: string, updatedText: string, updatedTarget: number) => {
     const updatedGroups = userData.groups.map(group => {
      if (group.id === groupId) {
        const updatedSupplications = group.supplications.map(s => {
          if (s.id === supplicationId) {
            return { ...s, text: updatedText, target: updatedTarget };
          }
          return s;
        });
        return { ...group, supplications: updatedSupplications };
      }
      return group;
    });
    saveData({ ...userData, groups: updatedGroups });
  };


  const deleteSupplication = (groupId: string, supplicationId: string) => {
    const updatedGroups = userData.groups.map(group => {
      if (group.id === groupId) {
        return {
          ...group,
          supplications: group.supplications.filter(s => s.id !== supplicationId),
        };
      }
      return group;
    });
    saveData({ ...userData, groups: updatedGroups });
  };

  const incrementCount = (groupId: string, supplicationId: string) => {
    const updatedGroups = userData.groups.map(group => {
      if (group.id === groupId) {
        const updatedSupplications = group.supplications.map(s => {
          if (s.id === supplicationId) {
            return { ...s, currentCount: s.currentCount + 1 };
          }
          return s;
        });
        return { ...group, supplications: updatedSupplications };
      }
      return group;
    });
    saveData({ ...userData, groups: updatedGroups });
  };

  const resetCount = (groupId: string, supplicationId: string) => {
    const updatedGroups = userData.groups.map(group => {
      if (group.id === groupId) {
        const updatedSupplications = group.supplications.map(s => {
          if (s.id === supplicationId) {
            return { ...s, currentCount: 0 };
          }
          return s;
        });
        return { ...group, supplications: updatedSupplications };
      }
      return group;
    });
    saveData({ ...userData, groups: updatedGroups });
  };

  return { userData, loading, addGroup, deleteGroup, addSupplication, updateSupplication, deleteSupplication, incrementCount, resetCount };
};
