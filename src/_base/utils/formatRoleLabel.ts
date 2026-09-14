import { HubUserRole } from '../interfaces/user';

type FormateShortName = (role: HubUserRole) => string;

export const formatRoleLabel: FormateShortName = (role) => {
  const roleMapper: Record<HubUserRole, string> = {
    mayor: `Presidente`,
    parent: `Responsável`,
    principal: `Diretor`,
    teacher: `Professor`,
    student: `Aluno`,
  };
  return roleMapper[role];
};
