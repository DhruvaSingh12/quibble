import { User } from 'lucide-react';
import { LinkIt } from 'react-linkify-it';
import UserLinkWithTooltip from './UserLinkWithTooltip';

interface LinkifyProps {
    children: React.ReactNode;
}

export default function Linkify({ children }: LinkifyProps) {
    return (
        <LinkifyUsername>
            <LinkifyHashtag>
                <LinkifyUrl>
                    {children}
                </LinkifyUrl>
            </LinkifyHashtag>
        </LinkifyUsername>
    );
}

function LinkifyUrl({ children }: LinkifyProps) {
    return (
        <LinkIt
            regex={/(https?:\/\/[^\s]+)/g}
            component={(match, key) => (
                <span
                    key={key}
                    className="text-primary hover:underline cursor-pointer"
                    onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        window.open(match, "_blank");
                    }}
                >
                    {match}
                </span>
            )}
        >
            {children}
        </LinkIt>
    );
}

function LinkifyUsername({ children }: LinkifyProps) {
    return (
        <LinkIt
            regex={/(@[a-zA-Z0-9_-]+)\b/}
            component={(match, key) => (
                <UserLinkWithTooltip key={key} username={match.slice(1)}>
                    {match}
                </UserLinkWithTooltip>
            )}
        >
            {children}
        </LinkIt>
    );
}

function LinkifyHashtag({ children }: LinkifyProps) {
    return (
        <LinkIt
            regex={/(#[a-zA-Z0-9_-]+)/}
            component={(match, key) => (
                <span
                    key={key}
                    className="text-primary hover:underline cursor-pointer"
                    onClick={() => window.location.href = `/hashtag/${match.slice(1)}`}
                >
                    {match}
                </span>
            )}
        >
            {children}
        </LinkIt>
    );
}
