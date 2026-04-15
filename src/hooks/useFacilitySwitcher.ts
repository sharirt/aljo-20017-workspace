import { useState, useEffect } from "react";
import { useEntityGetAll } from "@blocksdiy/blocks-client-sdk/reactSdk";
import { FacilityManagerProfilesEntity, FacilitiesEntity } from "@/product-types";

function getStorageKey(email: string) {
  return `aljo_active_facility_id_${email}`;
}

export function useFacilitySwitcher(userEmail: string, isAuthenticated: boolean) {
  const { data: allProfiles, isLoading: loadingProfiles } = useEntityGetAll(
    FacilityManagerProfilesEntity,
    { email: userEmail },
    { enabled: isAuthenticated && !!userEmail }
  );

  const { data: allFacilities, isLoading: loadingFacilities } = useEntityGetAll(
    FacilitiesEntity,
    {},
    { enabled: isAuthenticated }
  );

  const [activeFacilityId, setActiveFacilityIdState] = useState<string>("");

  // Sync from localStorage + profiles
  useEffect(() => {
    if (!allProfiles?.length || !userEmail) return;

    const storageKey = getStorageKey(userEmail);
    const stored = localStorage.getItem(storageKey);
    const profileIds = allProfiles.map((p: any) => p.facilityProfileId).filter(Boolean);

    if (stored && profileIds.includes(stored)) {
      setActiveFacilityIdState(stored);
    } else {
      const defaultId = (allProfiles[0] as any)?.facilityProfileId || "";
      setActiveFacilityIdState(defaultId);
      if (defaultId) {
        localStorage.setItem(storageKey, defaultId);
      }
    }
  }, [allProfiles, userEmail]);

  const setActiveFacilityId = (id: string) => {
    setActiveFacilityIdState(id);
    if (userEmail) {
      localStorage.setItem(getStorageKey(userEmail), id);
    }
    window.dispatchEvent(new CustomEvent("aljo_facility_changed"));
  };

  const activeProfile = allProfiles?.find(
    (p: any) => p.facilityProfileId === activeFacilityId
  ) || allProfiles?.[0] || null;

  const activeFacilityName = allFacilities?.find(
    (f: any) => f.id === activeFacilityId
  )?.name as string | undefined;

  const isMultiFacility = (allProfiles?.length || 0) >= 2;

  const isLoading = loadingProfiles || loadingFacilities;

  // Build profiles with facility names for the switcher UI
  const profilesWithNames = allProfiles?.map((p: any) => ({
    ...p,
    facilityName: allFacilities?.find((f: any) => f.id === p.facilityProfileId)?.name || "Unknown Facility",
  })) || [];

  return {
    allProfiles: profilesWithNames,
    activeProfile,
    activeFacilityId,
    activeFacilityName,
    setActiveFacilityId,
    isLoading,
    isMultiFacility,
  };
}