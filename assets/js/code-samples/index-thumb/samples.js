function BCLS_player_samples(group_names) {
  var samples_wrapper = document.getElementById('samples_wrapper'),
    buttons_wrapper = document.getElementById('buttons_wrapper'),
    samples = samples_wrapper.querySelectorAll('section.samples-section'),
    sample_groups = {},
    buttons;
console.log('group_names', group_names);
  /**
   * converts string to title case (all words)
   * @param {string} str string to convert
   * @returns {string} converted string
   */
  function to_title_case(str) {
    str = str.toLowerCase().split(' ');
    for (var i = 0; i < str.length; i++) {
      str[i] = str[i].charAt(0).toUpperCase() + str[i].slice(1);
    }
    return str.join(' ');
  }

  /**
   * gets value of a URL param on current page URL if exists
   * @param {string} name the param you want the value of
   * @return {string} result value of param if exists or ""
   */
  function get_url_param(name) {
    var regex,
      results;
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    regex = new RegExp("[\\?&]" + name + "=([^&#]*)");
    results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, " "));
  }

  /**
   * determines whether an element has a specified class
   * @param {element} elem the html element
   * @param {string} class_name the class
   * @return {boolean}
   */
  function has_class(elem, class_name) {
    return (elem.classList.contains(class_name));
  }

  function highlight_selected_button(group) {
    var i, iMax;
    iMax = buttons.length;
    for (i = 0; i < iMax; i++) {
      buttons[i].setAttribute('class', 'group-button');
    }
    for (i = 0; i < iMax; i++) {
      if (buttons[i].id === group) {
        buttons[i].setAttribute('class', 'selected-button');
      }
    }
  }

  function create_sample_groups() {
    var iMax,
      i;
    iMax = group_names.length;
    for (i = 0; i < iMax; i++) {
      if (group_names[i] === 'all') {
        sample_groups[group_names[i]] = samples;
      } else {
        sample_groups[group_names[i]] = document.querySelectorAll('.' + group_names[i]);
      }
    }
  }

  function inject_buttons() {
    var btn,
      txt,
      i,
      iMax,
      br = document.createElement('br'),
      frag = document.createDocumentFragment();
    iMax = group_names.length;
    for (i = 0; i < iMax; i++) {
      btn = document.createElement('button');
      btn.setAttribute('class', 'group-button');
      btn.setAttribute('id', group_names[i]);
      txt = group_names[i].replace(/_/g, ' ');
      btn.textContent = txt;
      frag.appendChild(btn);
      if (group_names[i] === 'all') {
        frag.appendChild(br);
      }
    }
    buttons_wrapper.appendChild(frag);
    buttons = document.querySelectorAll('.group-button');
    iMax = buttons.length;
    for (i = 0; i < iMax; i++) {
      buttons[i].addEventListener('click', function() {
        set_group(this.getAttribute('id'));
      });
    }
  }

  /**
   * sets the group of samples to be displayed
   */
  function set_group(group) {
    var i,
      iMax,
      frag = document.createDocumentFragment(),
      group_nodes;
    while (samples_wrapper.firstChild) {
      samples_wrapper.removeChild(samples_wrapper.firstChild);
    }
    group_nodes = sample_groups[group];
    iMax = group_nodes.length;
    for (i = 0; i < iMax; i++) {
      frag.appendChild(group_nodes[i]);
    }
    samples_wrapper.appendChild(frag);
    highlight_selected_button(group);
  }

  function init() {
    if (group_names) {
      var param = get_url_param('group');
      inject_buttons();
      create_sample_groups();
      if (param === null) {
        set_group('popular');
      } else {
        set_group(param);
      }
    }
  }

  init();

}
