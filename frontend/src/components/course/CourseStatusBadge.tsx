interface CourseStatusBadgeProps {
  status: 'draft' | 'published' | 'archived' | string;
  labels?: { draft: string; published: string; archived: string };
}

export default function CourseStatusBadge({ status, labels }: CourseStatusBadgeProps) {
  const defaultLabels = { draft: 'Draft', published: 'Published', archived: 'Archived' };
  const l = labels || defaultLabels;

  const styles: Record<string, string> = {
    draft: 'bg-warning/15 text-warning border-warning/20',
    published: 'bg-success/15 text-success border-success/20',
    archived: 'bg-muted text-muted-foreground border-border',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize border ${styles[status] || styles.draft}`}>
      {status === 'published' ? l.published : status === 'archived' ? l.archived : l.draft}
    </span>
  );
}
