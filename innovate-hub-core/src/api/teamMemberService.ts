import axiosInstance from '../lib/axios';

export interface SocialLinks {
  github?: string;
  linkedin?: string;
  email?: string;
}

export interface TeamMember {
  _id: string;
  name: string;
  role: string;
  category: 'hod' | 'guide' | 'student' | 'custom';
  tagline?: string;
  department?: string;
  quote?: string;
  description?: string;
  image?: string;
  badgeColor?: string;
  socialLinks?: SocialLinks;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const getTeamMembers = async (category?: string): Promise<TeamMember[]> => {
  const params = category ? { category } : {};
  const response = await axiosInstance.get('/team-members', { params });
  return response.data.data || [];
};

export const createTeamMember = async (formData: FormData): Promise<TeamMember> => {
  const response = await axiosInstance.post('/team-members', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const updateTeamMember = async (id: string, formData: FormData): Promise<TeamMember> => {
  const response = await axiosInstance.put(`/team-members/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.data;
};

export const deleteTeamMember = async (id: string): Promise<boolean> => {
  const response = await axiosInstance.delete(`/team-members/${id}`);
  return response.data.success;
};

export const seedTeamMembers = async (): Promise<TeamMember[]> => {
  const response = await axiosInstance.post('/team-members/seed');
  return response.data.data;
};
