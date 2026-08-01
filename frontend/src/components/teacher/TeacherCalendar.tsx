'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, BookOpen, Clock } from 'lucide-react';
import { usePreference } from '@/context/PreferenceContext';

interface EventItem {
  id: number;
  title: string;
  time?: string;
  type?: string;
}

export default function TeacherCalendar() {
  const { t, language } = usePreference();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNamesVi = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const monthName = language === 'vi' ? monthNamesVi[month] : monthNamesEn[month];

  const daysOfWeekVi = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  // Days in month calculation
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Mon = 0
  const totalDays = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Mock upcoming events matching the teacher workspace schedule
  const upcomingEvents: EventItem[] = [
    {
      id: 1,
      title: 'Lập trình Python',
      time: '14:00 - 16:00',
      type: 'Cập nhật đề cương'
    },
    {
      id: 2,
      title: 'Cấu trúc dữ liệu & Giải thuật',
      time: '09:00 - 11:00',
      type: 'Chấm bài tập'
    }
  ];

  const todayDateNum = new Date().getDate();

  return (
    <div className="bg-card border border-border/60 rounded-2xl p-4 sm:p-5 space-y-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40">
        <h3 className="font-extrabold text-xs tracking-tight text-foreground truncate">
          {language === 'en' ? 'Weekly Teaching & Work Schedule' : 'Lịch giảng dạy & Lịch làm việc tuần này'}
        </h3>
      </div>

      {/* Mini Calendar Block */}
      <div className="space-y-3">
        {/* Month Navigation */}
        <div className="flex items-center justify-between px-1">
          <span className="font-extrabold text-xs text-foreground">
            {monthName} {year}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Previous Month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Next Month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {daysOfWeekVi.map((day) => (
            <span key={day} className="text-[11px] font-bold text-muted-foreground/80 py-1">
              {day}
            </span>
          ))}
        </div>

        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Empty cells for padding */}
          {Array.from({ length: adjustedFirstDay }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-7 w-7 mx-auto" />
          ))}

          {/* Actual days */}
          {Array.from({ length: totalDays }).map((_, idx) => {
            const dayNum = idx + 1;
            const isToday = dayNum === todayDateNum;

            return (
              <div
                key={`day-${dayNum}`}
                className="flex items-center justify-center h-7 w-7 mx-auto text-xs"
              >
                <button
                  className={`h-7 w-7 rounded-full flex items-center justify-center font-bold transition-all text-xs cursor-pointer ${
                    isToday
                      ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/30 font-extrabold'
                      : 'hover:bg-muted text-foreground/80'
                  }`}
                >
                  {dayNum}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Events Block */}
      <div className="pt-4 border-t border-border/40 space-y-3">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <div>
            <h4 className="font-extrabold text-xs text-foreground">
              {language === 'en' ? 'Upcoming This Week' : 'Upcoming tuần này'}
            </h4>
            <p className="text-[11px] text-muted-foreground">
              {language === 'en' ? 'Suggested course content updates' : 'Bổ sung khóa học đề xuất cập nhật'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {upcomingEvents.map((evt) => (
            <div
              key={evt.id}
              className="p-3 bg-muted/40 border border-border/40 rounded-xl space-y-1 hover:border-primary/30 transition-all text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground truncate">{evt.title}</span>
                {evt.type && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary shrink-0">
                    {evt.type}
                  </span>
                )}
              </div>
              {evt.time && (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{evt.time}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
