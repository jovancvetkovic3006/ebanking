import Link from "next/link";

export default function AdminIndexPage() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/users" className="border rounded p-4 hover:bg-gray-50">Users</Link>
        <Link href="/admin/transactions" className="border rounded p-4 hover:bg-gray-50">Transactions</Link>
        <Link href="/admin/audit" className="border rounded p-4 hover:bg-gray-50">Audit Logs</Link>
      </div>
      <div>
        <Link href="/dashboard" className="underline">Back to Dashboard</Link>
      </div>
    </div>
  );
}
