import { redirect } from "next/navigation";

export default function InvoicesPage() {
    // Redirect to projects since invoices are generated per project
    redirect("/projects");
}
