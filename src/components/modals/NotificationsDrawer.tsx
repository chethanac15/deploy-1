import React from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { AlertCircle, ArrowUpRight, CheckCircle2, Clock, Check, Bell } from 'lucide-react';

export const NotificationsDrawer: React.FC = () => {
  const { 
    isNotificationsOpen, 
    setIsNotificationsOpen, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    openProjectDetail 
  } = useApp();

  const handleNotificationClick = (item: any) => {
    markNotificationRead(item.id);
    if (item.projectId) {
      openProjectDetail(item.projectId);
      setIsNotificationsOpen(false);
    }
  };

  return (
    <Modal
      isOpen={isNotificationsOpen}
      onClose={() => setIsNotificationsOpen(false)}
      title="Studio Notifications & Alerts"
      subtitle="Stay ahead of critical project budgets, deliveries, and milestones."
      maxWidth="md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500">
            {notifications.filter(n => !n.read).length} unread updates
          </span>
          <button
            onClick={markAllNotificationsRead}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {notifications.map((item) => {
            let iconBg = 'bg-blue-100 text-blue-600';
            if (item.type === 'alert') iconBg = 'bg-rose-100 text-rose-600';
            else if (item.type === 'payment') iconBg = 'bg-amber-100 text-amber-600';
            else if (item.type === 'milestone') iconBg = 'bg-emerald-100 text-emerald-600';

            return (
              <div
                key={item.id}
                onClick={() => handleNotificationClick(item)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                  !item.read
                    ? 'bg-brand-50/40 border-brand-200/80 shadow-xs'
                    : 'bg-white border-slate-100 hover:bg-slate-50'
                }`}
              >
                <div className={`p-2 rounded-lg shrink-0 ${iconBg}`}>
                  {item.type === 'alert' ? (
                    <AlertCircle className="w-4 h-4" />
                  ) : item.type === 'milestone' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <h4 className={`text-xs font-bold truncate ${!item.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{item.description}</p>
                  
                  {item.projectId && (
                    <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-brand-600">
                      <span>View Project Workspace</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
