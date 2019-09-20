(($)=>$(()=>{
  const $form = $('.etgpg');

  $userInputs = $('<div/>');

  $userInputs.html(`
    <div class="etgpg__field">
      <label for="etgpg__salary">Salary</label>
      <div class="etgpg__input"><input id="etgpg__salary" name="salary" type="text" /><span class="etgpg__salary_msg"></span></div>
    </div>

    <div class="etgpg__field">
      <label for="etgpg__bonus">Bonus (optional)</label>
      <div class="etgpg__input"><input id="etgpg__bonus" name="bonus" type="text" /><span class="etgpg__bonus_msg"></span></div>
    </div>

    <div class="etgpg__field etgpg__field--company">
      <label for="etgpg__company">Company</label>
      <div class="etgpg__input">
        <input id="etgpg__company" name="company" />
        <div class="etgpg__hints"></div>
      </div>
    </div>

  `);
  const $button = $('<button>Calculate</button>').prop('disabled', true).on('click', handleCalculateButton);
  $userInputs.append($button);
  $form.append($userInputs);

  const $result = $('<div class="etgpg__result">Loading...</div>').hide();
  $form.append($result);

  const $companyInput = $form.find('input[name="company"]');
  const $salaryInput = $form.find('input[name="salary"]')
    .on('input', validateSalary);
  const $bonusInput = $form.find('input[name="bonus"]')
    .on('input', validateBonus);
  const $hints = $form.find('.etgpg__hints');
  var hintIndex = -1;
  var selectedCompany = false;
  var hints = [];
  var hintCount = 0;
  var debounce = false;
  var isSaving = false;

  function handleCalculateButton() {
    // Set the min height of the result box to that of the input box to minimise screen flashing.
    $result.css('min-height', $userInputs.height() + 'px').show();
    $userInputs.hide();

    // Log at the server.
    $.ajax({
      url: '/etgenderpaygap/submit',
      dataType: 'json',
      method: 'POST', // In case they upgrade to jQuery 1.9
      type: 'POST', // for jQuery 1.8
      data: {
        company: selectedCompany.id,
        salary: $salaryInput.val(),
        bonus: $bonusInput.val(),
      },
    })
    .then(r => {
      console.log(r);
      $result.empty();
      $result.append(
          (
            (r.paygap_salary > 0)
            ? `Based on the gender pay gap at <span>${r.company}</span>`
            : `We could not calculate a gender pay gap at your company, but based on the national average`
          )
        + ` the lifetime loss of income for someone at your pay is
        <div class="etgpg__loss">${r.lifetimeLoss}</div>
        <div class="etgpg__date-intro">The date when women cease to be paid compared to men is</div>
        <div class="etgpg__date">${r.last_paid_day}</div>

        <div class="etgpg__petition-ask">If you think this is bad, please
          <div class="etgpg__centre"><a href="#" class="etgpg__button">Sign the petition</a></div>
        </div>
        <div class="etgpg__total-stats">A total lifetime loss of
        ${r.lifetimeLossTotal} has been calculated from ${r.count} women using
        this tool.</div>`
      );
    })
    .fail((jqxhr, textStatus, error) => {
      $userInputs.show();
      $result.hide();
      alert("Sorry, something went wrong, please try again.");
    });

  }
  function parseAsNumber(v, optional) {
    // Trim.
    v = v.replace(/^\s*(.*?)\s*$/, '$1');
    if (v==='' && optional) {
      return;
    }
    v = v.replace(/[£,]/g, '');
    if (v.match(/^[1-9]\d\d\d+$/)) {
      return parseInt(v);
    }
    // Error
    return false;
  }
  function validateForm(showMessages) {
    valid = true;
    valid &= validateSalary();
    valid &= validateBonus();
    valid &= (!!selectedCompany);
    $button.prop('disabled', !valid);
  }
  function validateSalary() {
    valid = true;
    if (parseAsNumber($salaryInput.val()) !== false) {
      // Salary is ok.
      $form.find('.etgpg__salary_msg').empty();
    }
    else {
      valid = false;
      $form.find('.etgpg__salary_msg').text('Enter gross salary like 20000');
    }
    return valid;
  }
  function validateBonus() {
    valid = true;
    if (parseAsNumber($bonusInput.val(), true) !== false) {
      // Bonus is ok.
      $form.find('.etgpg__bonus_msg').empty();
    }
    else {
      valid = false;
      $form.find('.etgpg__bonus_msg').text('Enter gross bonus like 20000');
    }
    return valid;
  }
  function selectCompany() {
    console.log("selectCompany", hintIndex, hints[hintIndex]);
    $companyInput.val(hints[hintIndex].name);
    selectedCompany = hints[hintIndex];
    $hints.hide();
    validateForm();
  }
  function highlightCompany() {
    $hints.find('li.highlighted').removeClass('highlighted');
    if (hintIndex>-1) {
      $hints.find('li').eq(hintIndex).addClass('highlighted');
    }
  }
  function handleKeyUp(e) {
    if (e.keyCode == 13) {
      if (hintIndex < 0) {
        // Cannot submit.

      }
      else {
        selectCompany();
        // Select hint.
        // @todo trigger save.
        // @todo update lifetime loss.
      }
    }
    else if (e.keyCode == 38) {
      hintIndex--;
      if (hintIndex <0) {
        hintIndex = hints.length - 1;
      }
      highlightCompany();
    }
    else if (e.keyCode == 40) {
      hintIndex++;
      if (hintIndex >= hints.length) {
        hintIndex--;
      }
      highlightCompany();
    }
    else {
      if (debounce) {
        window.clearTimeout(debounce);
        debounce = false;
      }
      if ($companyInput.val().replace(/^\s*(.*?)\s*$/, '$1')) {
        debounce = window.setTimeout(getMatches, 150);
      }
      else {
        hints = [];
        hintIndex = -1;
        highlightCompany();
      }
    }
  }
  function getMatches() {
    $.getJSON('/etgenderpaygap/matches', { company: $companyInput.val() })
    .done(json => {
      console.log("matches", json);
      hints = json.matches;
      hintCount = json.count;
      createHints();
    })
    .fail((jqxhr, textStatus, error) => {
      var err = textStatus + ", " + error;
      console.log( "Request Failed: " + err );
    });
  }
  function createHints() {

    if (hintCount === 0) {
      // No hints, provide a fallback.
      hints = [{name: '(Other UK company, use average)', id: 0}];
    }
    const $ul = $('<ul/>');

    hints.forEach((hint, i) => {
      const $li = $('<li/>')
        .text(hint.name);
      $li.on('click', e => { console.log("hintIndex set to ", i); hintIndex = i; highlightCompany(); selectCompany(); });
      $ul.append($li);
    });
    hintIndex = 0;
    $hints.empty().append($ul);
    $hints.fadeIn('fast');

    highlightCompany();
  }

  $companyInput
    .on('keyup', handleKeyUp)
    .on('blur', e => $hints.fadeOut('fast'));


}))(jQuery);
