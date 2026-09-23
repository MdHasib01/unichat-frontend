import { redirect } from 'next/navigation';

// Templates are created in a dialog on the list, so this route sends you
// there with the editor open rather than duplicating the form.
export default function NewTemplatePage() {
  redirect('/templates?new=1');
}
