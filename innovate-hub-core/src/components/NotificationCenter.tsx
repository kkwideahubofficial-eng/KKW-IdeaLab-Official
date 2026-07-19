import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, Info, XCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/axios';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Notification {
  _id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/in-app');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Poll every 15s for near real-time
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/in-app/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/in-app/mark-all-read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all read', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }
    setIsOpen(false);

    // Redirect logic based on notification type / content
    const lowerTitle = notification.title.toLowerCase();
    const lowerType = notification.type?.toLowerCase() || '';

    if (lowerType === 'machinery' || lowerTitle.includes('machinery') || lowerTitle.includes('material')) {
      navigate('/coordinator-dashboard?tab=materials_machinery');
    } else if (lowerType === 'room_permission' || lowerTitle.includes('room')) {
      navigate('/coordinator-dashboard?tab=room_bookings');
    } else {
      // Default fallback
      navigate('/coordinator-dashboard');
    }
  };

  const getIconAndColor = (title: string, type: string) => {
    const t = title.toLowerCase();
    if (t.includes('rejected')) return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100' };
    if (t.includes('approved')) return { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100' };
    if (t.includes('review needed') || t.includes('pending')) return { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100' };
    if (t.includes('new') || t.includes('submitted')) return { icon: Info, color: 'text-blue-500', bg: 'bg-blue-100' };
    return { icon: Bell, color: 'text-slate-500', bg: 'bg-slate-100' };
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative rounded-full h-10 w-10 bg-white">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white border-2 border-white rounded-full text-[10px]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 mr-4 mt-2" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-bold text-sm">Notifications</h4>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs text-primary hover:bg-transparent">
              <CheckCircle className="w-3.5 h-3.5 mr-1" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const { icon: Icon, color, bg } = getIconAndColor(notif.title, notif.type);
                return (
                  <div 
                    key={notif._id} 
                    className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-primary/5' : ''}`}
                    onClick={() => handleNotificationClick(notif)}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${bg}`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start gap-2">
                          <p className={`text-sm leading-tight ${!notif.isRead ? 'font-bold' : 'font-medium text-slate-700'}`}>
                            {notif.title}
                          </p>
                          {!notif.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-snug">
                          {notif.body}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
          <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => { setIsOpen(false); navigate('/coordinator-dashboard'); }}>
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;
