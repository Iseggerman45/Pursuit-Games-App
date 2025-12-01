
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return Notification.permission;
};

export const sendNotification = (title: string, body?: string) => {
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    // Check if we are in a secure context (HTTPS or localhost) which is required for Service Workers/Notifications
    try {
        new Notification(title, {
            body: body,
            icon: 'https://cdn-icons-png.flaticon.com/512/2913/2913520.png', // Generic Flame Icon
            badge: 'https://cdn-icons-png.flaticon.com/512/2913/2913520.png'
        });
    } catch (e) {
        console.error("Notification failed", e);
    }
  }
};
