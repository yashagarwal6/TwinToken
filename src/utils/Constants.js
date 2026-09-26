export const Constants = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    
    // Fixed timestep simulation
    TICK_RATE: 60,
    TICK_DT: 1 / 60,
    MAX_ACCUMULATOR: 0.25, // prevents spiral of death
    
    // Player Physics (deterministic fixed 60Hz units)
    PLAYER_WIDTH: 24,
    PLAYER_HEIGHT: 38,
    GRAVITY: 1350,
    MOVE_SPEED: 240,
    JUMP_FORCE: 500,
    TERMINAL_VELOCITY: 750,
    COYOTE_TICKS: 6,      // 0.1s tolerance
    JUMP_BUFFER_TICKS: 6, // 0.1s tolerance
    
    // ECHO System
    TRIM_WINDOW_MAX_TICKS: 120, // 2 seconds at 60Hz
    DEFAULT_MAX_ECHOES: 2,
    
    // RIFT System
    RIFT_CYCLE_TAP_TICKS: 12, // <= 200ms is tap to cycle, > 200ms is hold to scrub
    RIFT_SCRUB_SPEED: 2,      // ticks rewound per simulation frame
    
    // Visual Themes
    COLORS: {
        BG: '#121318',
        BG_GRID: '#1a1c24',
        SOLID: '#2e3440',
        SOLID_BORDER: '#434c5e',
        PLAYER: '#88c0d0',
        PLAYER_EYE: '#eceff4',
        ECHO: 'rgba(129, 161, 193, 0.65)',
        ECHO_FROZEN: 'rgba(94, 129, 172, 0.85)',
        RIFT_AURA: '#b48ead',
        RIFT_OBJECT: '#d08770',
        PLATE_UNPRESSED: '#bf616a',
        PLATE_PRESSED: '#a3be8c',
        DOOR_CLOSED: '#ebcb8b',
        DOOR_OPEN: 'rgba(235, 203, 139, 0.25)',
        GOAL: '#e5e9f0',
        GOAL_GLOW: 'rgba(236, 239, 244, 0.3)',
        UI_TEXT: '#eceff4',
        UI_ACCENT: '#88c0d0',
        WARNING_IRREVERSIBLE: '#d08770'
    }
};
