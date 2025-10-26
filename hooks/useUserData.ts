import { useState, useEffect, useCallback } from 'react';
import type { UserData, Supplication } from '../types';
import {
  apiGetUserData,
  apiAddGroup,
  apiDeleteGroup,
  apiAddSupplication,
  apiUpdateSupplication,
  apiDeleteSupplication,
  apiIncrementCount,
  apiResetCount,
  apiResetGroupSupplications,
  apiReorderSupplications,
} from '../utils/api';

export const useUserData = (isAuthenticated: boolean) => {
  const [userData, setUserData] = useState<UserData>({ groups: [] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isAuthenticated) {
      setLoading(true);
      try {
        const data = await apiGetUserData();
        setUserData(data);
      } catch (error) {
        console.error("Failed to load user data:", error);
        // Handle token expiration or other auth errors by logging out
      } finally {
        setLoading(false);
      }
    } else {
      setUserData({ groups: [] });
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const addGroup = async (name: string) => {
    try {
        await apiAddGroup(name);
        await loadData(); // Re-fetch data to get the new group with its server-generated ID
    } catch (error) {
        console.error("Failed to add group:", error);
    }
  };
  
  const deleteGroup = async (groupId: string) => {
    const previousState = userData;
    setUserData(prevData => ({ ...prevData, groups: prevData.groups.filter(g => g.id !== groupId) }));
    try {
        await apiDeleteGroup(groupId);
    } catch (error) {
        console.error("Failed to delete group:", error);
        setUserData(previousState); // Revert on error
    }
  };
  
  const addSupplication = async (groupId: string, title: string, text: string, target: number) => {
     try {
        await apiAddSupplication(groupId, title, text, target);
        await loadData(); // Re-fetch
    } catch (error) {
        console.error("Failed to add supplication:", error);
    }
  };

  const updateSupplication = async (groupId: string, supplicationId: string, updatedTitle: string, updatedText: string, updatedTarget: number) => {
    const previousState = userData;
    try {
        const updatedSupplication = await apiUpdateSupplication(supplicationId, updatedTitle, updatedText, updatedTarget);
        setUserData(prevData => {
            const newGroups = prevData.groups.map(g => {
                if (g.id === groupId) {
                    return { ...g, supplications: g.supplications.map(s => s.id === supplicationId ? updatedSupplication : s) };
                }
                return g;
            });
            return { ...prevData, groups: newGroups };
        });
    } catch (error) {
        console.error("Failed to update supplication:", error);
        setUserData(previousState); // Revert on error
    }
  };

  const deleteSupplication = async (groupId: string, supplicationId: string) => {
    const previousState = userData;
    setUserData(prevData => {
        const newGroups = prevData.groups.map(g => {
            if (g.id === groupId) {
                return { ...g, supplications: g.supplications.filter(s => s.id !== supplicationId) };
            }
            return g;
        });
        return { ...prevData, groups: newGroups };
    });
    try {
        await apiDeleteSupplication(supplicationId);
    } catch (error) {
        console.error("Failed to delete supplication:", error);
        setUserData(previousState);
    }
  };

  const incrementCount = async (groupId: string, supplicationId: string) => {
     const previousState = userData;
    try {
        const updatedSupplication = await apiIncrementCount(supplicationId);
        setUserData(prevData => {
            const newGroups = prevData.groups.map(g => {
                if (g.id === groupId) {
                    return { ...g, supplications: g.supplications.map(s => s.id === supplicationId ? updatedSupplication : s) };
                }
                return g;
            });
            return { ...prevData, groups: newGroups };
        });
    } catch (error) {
        console.error("Failed to increment count:", error);
        setUserData(previousState);
    }
  };

  const resetCount = async (groupId: string, supplicationId: string) => {
     const previousState = userData;
     try {
        const updatedSupplication = await apiResetCount(supplicationId);
        setUserData(prevData => {
            const newGroups = prevData.groups.map(g => {
                if (g.id === groupId) {
                    return { ...g, supplications: g.supplications.map(s => s.id === supplicationId ? updatedSupplication : s) };
                }
                return g;
            });
            return { ...prevData, groups: newGroups };
        });
    } catch (error) {
        console.error("Failed to reset count:", error);
        setUserData(previousState);
    }
  };

  const resetGroupSupplications = async (groupId: string) => {
    const previousState = userData;
    try {
        const updatedSupplications = await apiResetGroupSupplications(groupId);
        setUserData(prevData => {
            const newGroups = prevData.groups.map(g => {
                if (g.id === groupId) {
                    return { ...g, supplications: updatedSupplications };
                }
                return g;
            });
            return { ...prevData, groups: newGroups };
        });
    } catch (error) {
        console.error("Failed to reset group supplications:", error);
        setUserData(previousState);
    }
  };

  const reorderSupplications = async (groupId: string, supplicationIds: string[]) => {
    const previousState = userData;
    try {
        const updatedSupplications = await apiReorderSupplications(groupId, supplicationIds);
        setUserData(prevData => {
            const newGroups = prevData.groups.map(g => {
                if (g.id === groupId) {
                    return { ...g, supplications: updatedSupplications };
                }
                return g;
            });
            return { ...prevData, groups: newGroups };
        });
    } catch (error) {
        console.error("Failed to reorder supplications:", error);
        setUserData(previousState);
    }
  };

  return { userData, loading, addGroup, deleteGroup, addSupplication, updateSupplication, deleteSupplication, incrementCount, resetCount, resetGroupSupplications, reorderSupplications };
};
