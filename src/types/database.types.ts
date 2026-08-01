// Tipos manuais espelhando supabase/migrations/0001_init.sql
//
// Quando o projeto estiver linkado ao Supabase CLI, substitua este
// arquivo pelo gerado automaticamente:
//   npm run supabase:types
// (ajuste o project-id no script em package.json antes)

export type LessonStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type PackageStatus = "ACTIVE" | "FINISHED";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          timezone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]> & {
          id: string;
          name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      students: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          whatsapp: string | null;
          share_token: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["students"]["Row"]> & {
          user_id: string;
          name: string;
          email: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Row"]>;
      };
      lesson_packages: {
        Row: {
          id: string;
          student_id: string;
          package_size: number;
          price: number;
          paid_at: string;
          status: PackageStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["lesson_packages"]["Row"]
        > & {
          student_id: string;
          package_size: number;
          price: number;
        };
        Update: Partial<Database["public"]["Tables"]["lesson_packages"]["Row"]>;
      };
      lessons: {
        Row: {
          id: string;
          student_id: string;
          professor_id: string;
          package_id: string | null;
          start_at: string;
          end_at: string;
          status: LessonStatus;
          notes: string | null;
          created_at: string;
          updated_at: string;
          title: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["lessons"]["Row"]> & {
          student_id: string;
          professor_id: string;
          start_at: string;
          end_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["lessons"]["Row"]>;
      };
      lesson_reschedules: {
        Row: {
          id: string;
          lesson_id: string;
          old_start_at: string;
          new_start_at: string;
          reason: string | null;
          changed_by: string;
          changed_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["lesson_reschedules"]["Row"]
        > & {
          lesson_id: string;
          old_start_at: string;
          new_start_at: string;
          changed_by: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["lesson_reschedules"]["Row"]
        >;
      };
      audit_logs: {
        Row: {
          id: string;
          table_name: string;
          record_id: string;
          action: string;
          old_value: unknown;
          new_value: unknown;
          actor_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]> & {
          table_name: string;
          record_id: string;
          action: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Row"]>;
      };
    };
  };
}
