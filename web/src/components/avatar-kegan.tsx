import { Avatar as BaseAvatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import ProfilePic from "@/assets/profile.jpg"

type AvatarProps = {
    className: string
}

export function Avatar({ className }: AvatarProps) {
    return (<BaseAvatar className={className}>
        <AvatarImage src={ProfilePic} alt="Kegan Hollern" />
        <AvatarFallback>KH</AvatarFallback>
    </BaseAvatar>)
}