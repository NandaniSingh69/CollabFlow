export default function Cursor({ x, y, name, color }) {
  return (
    <div
      className="pointer-events-none absolute z-50 transition-all duration-75"
      style={{
        left: x,
        top: y,
        transform: "translate(-2px, -2px)"
      }}
    >
      {/* Cursor arrow */}
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M5.65376 12.4563L11.1068 20.3988C11.3241 20.7278 11.8066 20.6818 11.9548 20.3185L14.2741 14.9285C14.3543 14.7421 14.5142 14.5994 14.7082 14.5395L20.2888 12.8173C20.6715 12.6988 20.7404 12.1854 20.4088 11.9677L5.97375 2.84153C5.62574 2.61285 5.16655 2.93887 5.29072 3.33759L7.8176 11.4563C7.88903 11.6863 7.82358 11.9363 7.65376 12.1063L5.65376 12.4563Z"
          fill={color}
          stroke="white"
          strokeWidth="1.5"
        />
      </svg>
      
      {/* Name tag */}
      <div
        className="absolute left-4 top-4 px-2 py-0.5 rounded text-xs font-medium text-white whitespace-nowrap shadow-md"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </div>
  )
}
