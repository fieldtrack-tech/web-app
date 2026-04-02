import { apiGet } from "@/lib/api/client";
import { API } from "@/lib/api/endpoints";
import type { EmployeeProfileData } from "@/types";

export const profileApi = {
  myProfile: () => apiGet<EmployeeProfileData>(API.myProfile),
  employeeProfile: (id: string) => apiGet<EmployeeProfileData>(API.employeeProfile(id)),
};
