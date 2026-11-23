/** NOTE: the field is spelled `quetions` (sic) in the backend API and must be sent exactly like that. */
export interface IHubFormQuestion {
  id: string;
  title: string;
  description?: string | null;
}

export interface IRegisterHubFormParams {
  title: string;
  description?: string | null;
  quetions: IHubFormQuestion[];
  /** Permission ids. Same permissions that networks have; a restricted network only sees forms sharing one. */
  permissions?: string[] | null;
  /** Grades the form applies to. Can only be set on creation (PATCH does not accept it). */
  grades: string[];
}

export interface IHubForm {
  id: string;
  title: string;
  description?: string | null;
  quetions?: IHubFormQuestion[];
  grades?: string[];
}
