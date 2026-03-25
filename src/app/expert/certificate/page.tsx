import { redirect } from 'next/navigation';

export default function CertificateRedirect() {
  redirect('/profile?tab=certificate');
}
