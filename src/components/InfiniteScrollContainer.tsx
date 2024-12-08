import {useInView} from "react-intersection-observer";

interface InfiniteScrollContainerProps extends React.PropsWithChildren{
    onButtonReached : () => void,
    className?: string
}

export default function InfiniteScrollContainer({
    children, onButtonReached, className
}: InfiniteScrollContainerProps) {
    const {ref} = useInView({
        rootMargin: "200px",
        onChange: (inView) => {
            if(inView) onButtonReached();
        },
    });

    return (
        <div className={className}>
            {children}
            <div ref={ref} />
        </div>
    )
}