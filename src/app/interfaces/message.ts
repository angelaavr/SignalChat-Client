export interface iMessage {
    content: string;
    user: string;
    messageTime: string;
    disappearAfter: number | null;
    remainingTime: number | null;
    remainingPercentage: string | null;
}