const control = require('./control');

const light = {
  dpid: {
    switch_led: 1,
    work_mode: 2,
    bright_value: 4,
    speed_value: 8,
    sensitivity_value: 10,
    rgb_turn: 11,
    countdown: 13,
    normal_timer: 14,
    music_index: 15,
    dream_static_color: 16,
    dream_control_data: 17,
    dream_scene_index: 19,
    dir_index: 35,
    text_char_num: 36,
    text_char_point: 37,
    text_char_modecolor: 38,
    text_border_color: 39,
    diy_2d_point: 40,
    diy_2d_index: 41,
    pincture_index: 42,
    screen_dir: 43,
    boot_status: 44
  },

  action: {
    switch_led: {
      on: 1,
      off: 0
    },
    rgb_turn: {
      GR: 0,
      RG: 1,
      GB: 2,
      RB: 3,
      BR: 4,
      BG: 5
    }
  },

  // DPs that must enable the panel or select a mode first.
  __controlPrefix: {
    2: { 1: 1 },
    4: { 1: 1 },
    15: { 1: 1 },
    17: { 1: 1, 2: 0 },
    19: { 1: 1, 2: 1 }
  },

  actual: {}
};

light.__proto__ = control.control;

module.exports = light;
