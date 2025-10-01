interface CoordinatesContainerProps {
    // Accept a ref object whose current may be HTMLDivElement or null.
    statusBarRef: React.RefObject<HTMLDivElement | null> | null;
}

export const CoordinatesContainer = ({ statusBarRef }: CoordinatesContainerProps) => {
  
    return (

        <div ref={statusBarRef} id="statusbar">
            <div id="progress-bar"></div>
            <span id="loading-percent"></span>
            <span id="memory-usage"></span>
            <button id="crs"></button>
            <div id="coordinates"></div>
            <div id="attributions"></div>
        </div>
    )
}