import 'server-only'
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:admin@socime.app',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export interface PushSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function sendPush(
  subscription: PushSubscription,
  payload: { title: string; body: string; url?: string }
): Promise<void> {
  await webpush.sendNotification(
    { endpoint: subscription.endpoint, keys: subscription.keys },
    JSON.stringify(payload)
  )
}
