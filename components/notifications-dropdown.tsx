"use client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Check, X, AlertCircle, Info, CheckCircle } from "lucide-react"

interface Notification {
  id: string; // API retorna string
  type: "info" | "warning" | "success" | "error" | "reminder";
  title: string;
  message: string;
  time: string; // Formatado como "X min atrás"
  read: boolean;
  createdAt?: string;
}

interface NotificationsDropdownProps {
  notifications: Notification[]
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  onDismiss: (id: string) => void
  isOpen: boolean
  onClose: () => void
}

export function NotificationsDropdown({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  isOpen,
  onClose,
}: NotificationsDropdownProps) {
  if (!isOpen) return null

  const getIcon = (type: string) => {
    switch (type) {
      case "info":
        return <Info className="w-4 h-4 text-blue-600" />
      case "warning":
        return <AlertCircle className="w-4 h-4 text-orange-600" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "error":
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "info":
        return "bg-blue-100 text-blue-800"
      case "warning":
        return "bg-orange-100 text-orange-800"
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div className="absolute top-16 right-6 w-96 max-h-96 overflow-hidden">
        <Card className="shadow-xl border-border animate-slide-down">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold flex items-center">
                Notificações
                {unreadCount > 0 && <Badge className="ml-2 bg-primary text-primary-foreground">{unreadCount}</Badge>}
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onMarkAllAsRead()
                    }}
                    className="text-xs"
                  >
                    Marcar todas como lidas
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              <div className="space-y-0">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-border last:border-b-0 hover:bg-slate-50 transition-colors ${
                      !notification.read ? "bg-blue-50/50" : ""
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-white truncate">{notification.title}</h4>
                            <p className="text-sm text-slate-200 mt-1 line-clamp-2">{notification.message}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-slate-300">{notification.time}</span>
                              <Badge className={`text-xs ${getBadgeVariant(notification.type)}`}>
                                {notification.type === "info" && "Info"}
                                {notification.type === "warning" && "Atenção"}
                                {notification.type === "success" && "Sucesso"}
                                {notification.type === "error" && "Erro"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex flex-col gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onMarkAsRead(notification.id)}
                                className="h-6 w-6"
                                title="Marcar como lida"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDismiss(notification.id)}
                              className="h-6 w-6 text-slate-400 hover:text-red-600"
                              title="Dispensar"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto mb-4 text-slate-300/20" />
                <h3 className="text-sm font-medium text-white mb-1">Nenhuma notificação</h3>
                <p className="text-sm text-slate-300">Você está em dia com tudo!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
