export interface DialogFormField {
    key: string;
    label: string;
    placeholder?: string;
    type: 'text' | 'number' | 'email' | 'password' | 'textarea';
    value?: any;
    width?: string;
}