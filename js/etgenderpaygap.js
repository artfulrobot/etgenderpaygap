;;

(function ($) {
  return $(function () {
    var $form = $('.etgpg');

    $userInputs = $('<div/>');

    $userInputs.html('\n    <div class="etgpg__field">\n      <label for="etgpg__salary">Salary</label>\n      <div class="etgpg__input"><input id="etgpg__salary" name="salary" type="number" /></div>\n    </div>\n\n    <div class="etgpg__field">\n      <label for="etgpg__bonus">Bonus (optional)</label>\n      <div class="etgpg__input"><input id="etgpg__bonus" name="bonus" type="number" /></div>\n    </div>\n\n    <div class="etgpg__field etgpg__field--company">\n      <label for="etgpg__company">Company</label>\n      <div class="etgpg__input">\n        <input id="etgpg__company" name="company" />\n        <div class="etgpg__hints"></div>\n      </div>\n    </div>\n\n  ');
    var $button = $('<button>Calculate</button>').prop('disabled', true).on('click', handleCalculateButton);
    $userInputs.append($button);
    $form.append($userInputs);

    var $result = $('<div class="etgpg__result">Loading...</div>').hide();
    $form.append($result);

    var $companyInput = $form.find('input[name="company"]');
    var $bonusInput = $form.find('input[name="bonus"]').on('input', validateForm);
    var $salaryInput = $form.find('input[name="salary"]').on('input', validateForm);
    var $hints = $form.find('.etgpg__hints');
    var hintIndex = -1;
    var selectedCompany = false;
    var hints = [];
    var hintCount = 0;
    var debounce = false;
    var isSaving = false;

    function handleCalculateButton() {
      $userInputs.hide();
      $result.show();

      // Log at the server.
      $.ajax({
        url: '/etgenderpaygap/submit',
        dataType: 'json',
        method: 'POST', // In case they upgrade to jQuery 1.9
        type: 'POST', // for jQuery 1.8
        data: {
          company: selectedCompany.id,
          salary: $salaryInput.val(),
          bonus: $bonusInput.val()
        }
      }).then(function (r) {
        console.log(r);
        $result.empty();
        $result.append((r.paygap_salary > 0 ? 'Based on the gender pay gap at <span>' + r.company + '</span>' : 'We could not calculate a gender pay gap at your company, but based on the national average') + (' the lifetime loss of income for someone at your pay is\n        <div class="etgpg__loss">' + r.lifetimeLoss + '</div>\n        If you think this is bad, please <a href="#" class="etgpg__button">Sign the petition</a>\n        A total lifetime loss of ' + r.lifetimeLossTotal + ' has been calculated from ' + r.count + ' women using this tool.'));
      }).fail(function (jqxhr, textStatus, error) {
        $userInputs.show();
        $result.hide();
        alert("Sorry, something went wrong, please try again.");
      });
    }
    function validateForm() {
      valid = !!selectedCompany && parseInt($salaryInput.val()) > 0;
      $button.prop('disabled', !valid);
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
      if (hintIndex > -1) {
        $hints.find('li').eq(hintIndex).addClass('highlighted');
      }
    }
    function handleKeyUp(e) {
      if (e.keyCode == 13) {
        if (hintIndex < 0) {
          // Cannot submit.

        } else {
          selectCompany();
          // Select hint.
          // @todo trigger save.
          // @todo update lifetime loss.
        }
      } else if (e.keyCode == 38) {
        hintIndex--;
        if (hintIndex < 0) {
          hintIndex = hints.length - 1;
        }
        highlightCompany();
      } else if (e.keyCode == 40) {
        hintIndex++;
        if (hintIndex >= hints.length) {
          hintIndex--;
        }
        highlightCompany();
      } else {
        if (debounce) {
          window.clearTimeout(debounce);
          debounce = false;
        }
        if ($companyInput.val().replace(/^\s*(.*?)\s*$/, '$1')) {
          debounce = window.setTimeout(getMatches, 150);
        } else {
          hints = [];
          hintIndex = -1;
          highlightCompany();
        }
      }
    }
    function getMatches() {
      $.getJSON('/etgenderpaygap/matches', { company: $companyInput.val() }).done(function (json) {
        console.log("matches", json);
        hints = json.matches;
        hintCount = json.count;
        createHints();
      }).fail(function (jqxhr, textStatus, error) {
        var err = textStatus + ", " + error;
        console.log("Request Failed: " + err);
      });
    }
    function createHints() {
      if (hintCount > 0) {
        var $ul = $('<ul/>');

        hints.forEach(function (hint, i) {
          var $li = $('<li/>').text(hint.name);
          $li.on('click', function (e) {
            console.log("hintIndex set to ", i);hintIndex = i;highlightCompany();selectCompany();
          });
          $ul.append($li);
        });
        hintIndex = 0;
        $hints.empty().append($ul);
        $hints.fadeIn('fast');
      } else {
        hintIndex = -1;
        $hints.empty();
      }
      highlightCompany();
    }

    $companyInput.on('keyup', handleKeyUp).on('blur', function (e) {
      return $hints.fadeOut('fast');
    });
  });
})(jQuery);
//# sourceMappingURL=etgenderpaygap.js.map
