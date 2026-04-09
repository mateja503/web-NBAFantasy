import { DialogFormField } from "./dialogFormField";

export interface DynamicDialogConfig {
    title: string;
    description?: string;
    fields: DialogFormField[];
    submitLabel?: string;
    submitButtonWidth?: string;
    cancelLabel?: string;
    cancelButtonWidth?: string;
    cancelButtonColor?: string;
    themeColor?: string;

    // onSubmit: (formData: { [key: string]: any }) => void;
}