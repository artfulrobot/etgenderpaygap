;;

(function ($) {
  return $(function () {
    var $form = $('.etgpg');

    $form.html('\n    <div class="etgpg__field"><label>Salary\n    <input name="salary" type="number" /></label></div>\n\n    <div class="etgpg__field"><label>Bonus (optional)\n    <input name="bonus" type="number" /></label></div>\n\n    <div class="etgpg__field"><label>Company\n    <input name="company" /></label>\n    <div class="etgpg__hints"></div></div>\n\n  ');
    var $button = $('<button>Calculate</button>').prop('disabled', true).on('click', handleCalculateButton);
    $form.append($button);

    var $result = $('<div class="etgpg__result"/>').hide();
    $form.append($result);

    var $companyInput = $form.find('input[name="company"]');
    var $bonusInput = $form.find('input[name="bonus"]');
    var $salaryInput = $form.find('input[name="salary"]');
    var $hints = $form.find('.etgpg__hints');
    var hintIndex = -1;
    var selectedCompany = false;
    var hints = [];
    var hintCount = 0;
    var debounce = false;

    function handleCalculateButton() {
      console.log("OK here you go ", selectedCompany);
      if (selectedCompany.paygap_hours > 0) {
        var salary = parseFloat($salaryInput.val());
        var loss = salary * selectedCompany.paygap_hours;
        var bonus = parseFloat($bonusInput.val());
        if (selectedCompany.paygap_bonus > 0 && bonus > 0) {
          loss += bonus * selectedCompany.paygap_bonus;
        }
        $result.html('Loss £' + Math.loss);
      } else {
        $result.html('We could not identify a pay gap at this company. National average is 18.2%');
      }
    }
    function validateForm() {
      if (selectedCompany) {
        $button.prop('disabled', false);
      }
    }
    function selectCompany() {
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
            hintIndex = i;highlightCompany();selectCompany();
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

    $companyInput.on('keyup', handleKeyUp);
  });
})(jQuery);
//# sourceMappingURL=etgenderpaygap.js.map
