
export type Department = 
  | 'Electrical Electronics Engineering'
  | 'Mechanical Engineering'
  | 'Mechatronics Engineering'
  | 'Agricultural Engineering'
  | 'Computer Engineering'
  | 'Chemical Engineering'
  | 'Civil Engineering';

export type Level = '100' | '200' | '300' | '400' | '500';

export interface UserRegistrationData {
  matric_number: string;
  full_name: string;
  password?: string;
  department: Department | '';
  level: Level;
  isHoc: boolean;
  secretCode: string;
  signature_data?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
