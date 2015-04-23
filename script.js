$(function(){
    "use strict";

    /**
     * Регионы России
     * */
    var TendersRegions = (function (_) {
        var $tendersRegion = $('.js-tenders-region'),
            $cityContainer = $tendersRegion.find('.js-cities-list'),
            $lettersNav = $tendersRegion.find('.js-letters-nav'),
            $federalDistrict = $tendersRegion.find('.js-federal-district'),
            $buttons = $tendersRegion.find('.js-b-buttons'),

            $formContainer = $('.js-form-container'),
            $tagsContainer = $formContainer.find('.js-tags-container'),

            sessionStorageKey = $formContainer.data('session-key') || 'pageAll',

            tmpCheckArray = {
                regions : {},
                cities: {}
            },

        // Добавление региона в объект
            addRegion = function (id, name) {
                tmpCheckArray.regions['i' + id] =  {
                    id : id,
                    text : name
                };
            },

        // Удаление региона из объекта
            deleteRegion = function (id) {
                tmpCheckArray.regions = _.omit(tmpCheckArray.regions, "i" + id);
            },

        // Добавление города в объект
            addCity = function (id, name) {
                tmpCheckArray.cities['i' + id] =  {
                    id : id,
                    text : name
                };
            },

        // Удаление города из объекта
            deleteCity = function (id) {
                tmpCheckArray.cities = _.omit(tmpCheckArray.cities, "i" + id);
            },

        // Функционал реализующий работу чекбоксов относящихся в региону
            checkboxRegion = function () {
                var $this = this,
                    id   = $this.val(),
                    name = $this.data('name');

                $this.is(':checked') ? addRegion(id, name) : deleteRegion(id);
            },

        // Генерация нового лайбла
            getLabel = function (code, name, isBold, classInput) {
                var cl = classInput ? 'class="' + classInput + '"' : '',
                    elName = isBold ? '<strong>' + name + '</strong>' : name;

                return $('<label class="regions-rus__lbl"><input type="checkbox" ' + cl + ' value="' + code + '" data-name="' + name + '"/> ' + elName + '</label>');
            },

        // Установка в checked инпутов на основе данных из объекта
            setCheckbox = function (checkObject, container) {
                var key, input;

                for (key in checkObject) {
                    if (checkObject.hasOwnProperty(key)) {
                        input = container.find('input[value="' + checkObject[key].id + '"]');
                        if (input.length > 0) {
                            input.prop('checked', true);
                        }
                    }
                }
            },

        // При выборе региона в контейнере Федеральный округ, нужно отметить все города принадлежащие округу
            noteCitiesRegion = function () {
                var $this = this,
                    code = $this.val();

                $.ajax({
                    type: "POST",
                    url: "/includes/kladr_city_buildtenders.php",
                    data: {action: 'getCitiesKladr', CODE: code},
                    dataType: 'json'
                }).done(function (data) {
                    var key, input;

                    for (key in data) {
                        if (data.hasOwnProperty(key)) {
                            $this.is(':checked') ? addCity(key, data[key]) : deleteCity(key);
                            input = $cityContainer.find('input[value="' + key + '"]');
                            input.prop('checked', $this.is(':checked'));
                        }
                    }
                }).fail(function () {
                    console.log("$.ajax failed!");
                });
            },

        // Формирование строки с айдишниками
            getStringId = function (checkObject, separator) {
                var key,
                    arrId = [];

                for (key in checkObject) {
                    if (checkObject.hasOwnProperty(key)) {
                        arrId.push(checkObject[key].id);
                    }
                }

                return arrId.join(separator);
            },

        // Запись выбранных городов и регионов в скрытые инпуты.
            setHiddenInput = function () {
                var $hiddenCity   = $('.js-hidden-city'),
                    $hiddenRegion = $('.js-hidden-region');

                $hiddenCity.val(getStringId(tmpCheckArray.cities, ','));
                $hiddenRegion.val(getStringId(tmpCheckArray.regions, ','));
            },

        // Формирование тега
            addTag = function (text, id) {
                $tagsContainer.append('<div class="filter__tags__i">' + text + '<i class="filter__tags__i--del js-tag-del" data-id="' + id + '" title="Убрать"></i></div>');
            },

        // Добавление тегов в форму
            addTags = function (checkObject) {
                var key;

                if (_.size(checkObject) > 0) {
                    for (key in checkObject) {
                        if (checkObject.hasOwnProperty(key)) {
                            addTag(checkObject[key].text, checkObject[key].id);
                        }
                    }
                    return true;
                }
                return false;
            },

        // Записать данные в sessionStorage
            setSessionStorage = function (data) {
                if (window.sessionStorage) {
                    sessionStorage.setItem('regionsRus_' + sessionStorageKey, data);
                }
            },

        // Получение данных из sessionStorage
            getSessionStorage = function () {
                if (window.sessionStorage && sessionStorage.getItem('regionsRus_' + sessionStorageKey)) {
                    return $.parseJSON(sessionStorage.getItem('regionsRus_' + sessionStorageKey));
                }
                return false;
            },

        // Удаление данных из sessionStorage
            deleteSessionStorage = function () {
                if (window.sessionStorage) {
                    sessionStorage.removeItem('regionsRus_' + sessionStorageKey);
                }
            },

        // Инициализация чекбоксов при загрузке страницы
            initCheckbox = function () {
                var objectValue = getSessionStorage();

                if (typeof objectValue === 'object') {

                    if (objectValue.hasOwnProperty('cities') && !(_.isEmpty(objectValue.cities))) {
                        tmpCheckArray.cities = objectValue.cities;
                        setCheckbox(tmpCheckArray.cities, $cityContainer);
                    }

                    if (objectValue.hasOwnProperty('regions') && !(_.isEmpty(objectValue.regions))) {
                        tmpCheckArray.regions = objectValue.regions;
                        setCheckbox(tmpCheckArray.regions, $cityContainer);
                        setCheckbox(tmpCheckArray.regions, $federalDistrict);
                    }
                }
            },

        // Инициализация тегов
            initTags = function () {
                if (_.size(tmpCheckArray.cities) > 0 || _.size(tmpCheckArray.regions) > 0) {
                    $tagsContainer.empty();
                    addTags(tmpCheckArray.cities);
                    addTags(tmpCheckArray.regions);
                }
            },

        // Навешиваем события
            event = function () {
                /*
                 * Обработчики для контенера с городами
                 */
                $cityContainer
                    // Добавление и удаление из массива городов и регионов
                    .on("click", "input[type='checkbox']", function () {
                        var $this = $(this),
                            id   = $this.val(),
                            name = $this.data('name');

                        if ($this.hasClass('js-choose-all')) { return; }

                        if ($this.hasClass('js-region')) {
                            // Если кликнули по чекбоксу относящемуся к региону
                            checkboxRegion.apply($this);
                        } else {
                            // Если кликнули по чекбоксу относящемуся к городу
                            $this.is(':checked') ? addCity(id, name) : deleteCity(id);
                        }
                    })
                    // Чекбокс "Выбрать все"
                    .on("click", ".js-choose-all", function () {
                        var $this = $(this),
                            arrayCheckbox = $cityContainer.find('input[type="checkbox"]').not('.js-choose-all');

                        if ($this.prop('checked')) {
                            arrayCheckbox.prop('checked', function () {
                                // Если чекбокс уже был добавлен, то его в массив не нужно добавлять
                                if (!$(this).is(':checked')) {
                                    $(this).trigger('click');
                                }
                                return true;
                            });
                        } else {
                            arrayCheckbox.prop('checked', function () {
                                // Если чекбокс был исключен то повторно исключать его не нужно
                                if ($(this).is(':checked')) {
                                    $(this).trigger('click');
                                }
                                return false;
                            });
                        }
                    });

                /*
                 * Обработчики для контейнера с буквами алфавита
                 */
                $lettersNav
                    // Обработчик для кнопки от А-Я
                    .on('click', '.js-letter-all', function () {
                        $.ajax({
                            type: "POST",
                            url: "/includes/kladr_city_buildtenders.php",
                            data: { action: 'getAll' },
                            dataType: 'json'
                        }).done(function (data) {
                            var labelMoskov =  getLabel(77, "Москва и Подмосковье", true, 'js-region'),
                                labelPiter =  getLabel(78, "Санкт-Петербург", true, 'js-region');

                            $cityContainer.empty();

                            $cityContainer.append(
                                $('<label class="regions-rus__lbl">' +
                                    '<input type="checkbox" class="js-choose-all"/> ' +
                                    '<strong>Выбрать все</strong>' +
                                    '</label>')
                            );

                            $cityContainer.append(labelMoskov).append(labelPiter);

                            $.each(data, function (letter, cities) {
                                $cityContainer.append('<div class="cities-lst__letter">' + letter + '</div>');

                                $.each(cities, function (code, name) {
                                    var label = getLabel(code, name, false);
                                    $cityContainer.append(label);
                                });
                            });

                            setCheckbox(tmpCheckArray.cities, $cityContainer);

                        }).fail(function () {
                            console.log("$.ajax failed!");
                        });
                    })
                    // Обработчик для букв
                    .on("click", ".js-letter", function () {
                        var $this = $(this);

                        $.ajax({
                            type: "POST",
                            url: "/includes/kladr_city_buildtenders.php",
                            data: { action: 'getCountryKladr', letter: $this.data('letter') },
                            dataType: 'json'
                        }).done(function (data) {
                            $cityContainer.empty();

                            $cityContainer.append(
                                $('<label class="regions-rus__lbl">' +
                                    '<input type="checkbox" class="js-choose-all"/> ' +
                                    '<strong>Выбрать все</strong>' +
                                    '</label>')
                            );

                            $.each(data, function (code, name) {
                                var label = getLabel(code, name, false);
                                $cityContainer.append(label);
                            });

                            setCheckbox(tmpCheckArray.cities, $cityContainer);

                        }).fail(function () {
                            console.log("$.ajax failed!");
                        });
                    });

                /*
                 * Обработчики для контейнера Федеральные округа
                 */
                $federalDistrict
                    // Обработчик для чекбоксов с регионами
                    .on('click', '.js-region', function () {
                        checkboxRegion.apply($(this));
                        noteCitiesRegion.apply($(this));
                    });

                /*
                 * Обработчики кнопок
                 */
                $buttons
                    // Кнопка выбрать, добавление тегов в форму
                    .on('click', '.js-tags-add-btn', function (e) {
                        e.preventDefault();
                        $tagsContainer.empty();
                        addTags(tmpCheckArray.cities);
                        addTags(tmpCheckArray.regions);
                        setHiddenInput();
                        $.genaBox.close();
                    })
                    // кнопка сбросить
                    .on('click', '.js-checked-reset', function () {
                        $tendersRegion.find('input[type="checkbox"]').prop('checked', false);
                        $tagsContainer.empty();
                        tmpCheckArray.regions = {};
                        tmpCheckArray.cities = {};
                        setHiddenInput();
                    })
                    // Кнопка отмена
                    .on('click', '.js-cancel', function (e) {
                        e.preventDefault();
                        $.genaBox.close();
                    });

                /*
                 * Обработчики формы
                 */
                $formContainer
                    // Удаление тегов
                    .on('click', '.js-tag-del', function () {
                        var $this = $(this),
                            id    = $this.data('id');

                        tmpCheckArray.cities = _.omit(tmpCheckArray.cities, "i" + id);
                        tmpCheckArray.regions = _.omit(tmpCheckArray.regions, "i" + id);

                        $tendersRegion.find('input[value="' + id + '"]').prop('checked', false);
                        $this.parent('.filter__tags__i').remove();
                        setHiddenInput();
                    })

                    // Событие по кнопке искать
                    .on('click', '.js-search-submit', function () {
                        (_.isEmpty(tmpCheckArray.cities) && _.isEmpty(tmpCheckArray.regions)) ? deleteSessionStorage() : setSessionStorage(JSON.stringify(tmpCheckArray));
                    })

                    // Удаление сессии по кнопке Очистить поля
                    .on('click', '.js-search-reset', function () {
                        deleteSessionStorage();
                    });
            };

        return {
            init: function () {
                $('.js-scroll-pane').jScrollPane({autoReinitialise: true});

                // Если существует скрытый input то его данные мы записываем в sessionStorage
                if ($("input[type='hidden']").is(".js-replace-session")) {
                    setSessionStorage($('.js-replace-session').val());
                }

                initCheckbox();
                setHiddenInput();
                initTags();
                event();
            }
        };
    }(window._));

    TendersRegions.init();
});