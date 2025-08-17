import ProfilePic from "@/assets/profile.jpg"
import { AvatarFallback, AvatarImage, Avatar as BaseAvatar } from "@/components/ui/avatar"

type AvatarProps = {
    className: string
}

export function Avatar({ className }: AvatarProps) {
    return (
        <BaseAvatar className={className}>
            <AvatarImage src={ProfilePic} alt="Kegan Hollern" />
            <AvatarFallback>KH</AvatarFallback>
        </BaseAvatar>
    )
}