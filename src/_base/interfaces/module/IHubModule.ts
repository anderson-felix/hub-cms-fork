import { IHubCourse } from '../course';
import { IHubModuleLesson } from '../moduleLesson';

export interface IHubModule {
  id: string;
  readable_id: number;
  dependency_id: string | null;
  hub_course_id: string;
  title: string;
  description: string | null;
  position: number;
  created_at: Date;
  updated_at: Date;
  dependency: IHubModule | null;
  course: IHubCourse;
  lessons: IHubModuleLesson[];
}
