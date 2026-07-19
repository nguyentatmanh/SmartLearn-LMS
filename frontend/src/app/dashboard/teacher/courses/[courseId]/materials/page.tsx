'use client';

import React, { useState, useEffect } from 'react';
import { usePreference } from '@/context/PreferenceContext';
import api from '@/lib/api';
import EmptyState from '@/components/common/EmptyState';
import { FileText, Loader2, Download, ExternalLink, Eye, EyeOff, Archive } from 'lucide-react';

interface MaterialsPageProps {
  course?: any;
  loading?: boolean;
  courseId?: string;
}

interface Material {
  id: number;
  title: string;
  description?: string;
  original_filename: string;
  mime_type?: string;
  file_extension?: string;
  size_bytes?: number;
  external_url?: string;
  material_type: string;
  visibility: string;
  is_downloadable: boolean;
  is_active: boolean;
  download_url?: string;
  created_at: string;
}

export default function MaterialsPage({ course, loading, courseId }: MaterialsPageProps) {
  const { language } = usePreference();
  const [materials, setMaterials] = useState<Material[]>([]);
  const [matLoading, setMatLoading] = useState(true);

  useEffect(() => {
    if (!courseId || loading) return;
    const fetchMaterials = async () => {
      setMatLoading(true);
      try {
        const res = await api.get(`/materials/courses/${courseId}/materials`);
        setMaterials(res.data || []);
      } catch {
        setMaterials([]);
      } finally {
        setMatLoading(false);
      }
    };
    fetchMaterials();
  }, [courseId, loading]);

  const formatSize = (bytes?: number) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading || matLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl">
        <EmptyState
          icon={<FileText className="h-7 w-7" />}
          title={language === 'en' ? 'No Materials Yet' : 'Chưa có tài liệu nào'}
          description={language === 'en'
            ? 'Upload files or add external links through the Materials Library to share resources with your students.'
            : 'Tải lên tệp tin hoặc thêm liên kết ngoài qua Thư viện Tài liệu để chia sẻ tài nguyên với học viên.'}
        />
      </div>
    );
  }

  const visibilityLabel = (v: string) => {
    const map: Record<string, Record<string, string>> = {
      teacher_only: { en: 'Teacher Only', vi: 'Chỉ giảng viên' },
      enrolled_students: { en: 'Enrolled', vi: 'Học viên' },
      public: { en: 'Public', vi: 'Công khai' },
    };
    return map[v]?.[language] || v;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {materials.length} {language === 'en' ? 'materials' : 'tài liệu'}
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
        {materials.map((m) => (
          <div key={m.id} className="px-5 py-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
            <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              {m.material_type === 'external_link' ? (
                <ExternalLink className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{m.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-[10px] text-muted-foreground capitalize">{m.material_type.replace('_', ' ')}</span>
                <span className="text-[10px] text-muted-foreground">· {formatSize(m.size_bytes)}</span>
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                  m.visibility === 'teacher_only' ? 'bg-warning/15 text-warning' :
                  m.visibility === 'public' ? 'bg-success/15 text-success' :
                  'bg-primary/10 text-primary'
                }`}>
                  {visibilityLabel(m.visibility)}
                </span>
                {!m.is_active && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-0.5">
                    <Archive className="h-2.5 w-2.5" />
                    {language === 'en' ? 'Archived' : 'Lưu trữ'}
                  </span>
                )}
              </div>
            </div>
            {m.download_url && (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}${m.download_url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 w-8 rounded-lg bg-muted hover:bg-primary/10 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
                title={language === 'en' ? 'Download' : 'Tải xuống'}
              >
                <Download className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
