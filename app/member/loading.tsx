export default function Loading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ios-bg-light">
      <div className="h-10 w-10 rounded-full border-[3px] border-brand-200 border-t-brand-600 animate-spin" />
    </div>
  );
}
