function BackgroundWrapper({ children }) {
    const wrapperStyle = {
        background: "rgb(25,24,48)",
        background: "linear-gradient(179deg, rgba(25,24,48,1) 0%, rgba(12,68,97,1) 49%)"
          // Optional, for spacing
    };
  
    return <div style={wrapperStyle}>{children}</div>;
  }
  
  export default BackgroundWrapper;