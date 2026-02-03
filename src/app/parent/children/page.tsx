import ChildrenList from "@/components/parent/dashboard/ChildrenList";

export default function ChildrenPage() {
  return (
    <div className="animate-in fade-in duration-500">
      <h1 className="text-3xl font-black font-nunito text-gray-900 mb-8">My Children</h1>
      <ChildrenList />
    </div>
  );
}
