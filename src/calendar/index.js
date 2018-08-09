import React, {Component} from 'react';
import {
  View,
  ViewPropTypes,
  ScrollView,
} from 'react-native';
import PropTypes from 'prop-types';

import XDate from 'xdate';
import dateutils from '../dateutils';
import {xdateToData, parseDate} from '../interface';
import styleConstructor from './style';
import Day from './day/basic';
import UnitDay from './day/period';
import MultiDotDay from './day/multi-dot';
import MultiPeriodDay from './day/multi-period';
import SingleDay from './day/custom';
import CalendarHeader from './header';
import shouldComponentUpdate from './updater';

//Fallback when RN version is < 0.44
const viewPropTypes = ViewPropTypes || View.propTypes;

const EmptyArray = [];

class Calendar extends Component {
  static propTypes = {
    // Specify theme properties to override specific styles for calendar parts. Default = {}
    theme: PropTypes.object,
    // Collection of dates that have to be marked. Default = {}
    markedDates: PropTypes.object,

    // Specify style for calendar container element. Default = {}
    style: viewPropTypes.style,
    // Initially visible month. Default = Date()
    current: PropTypes.any,
    // Minimum date that can be selected, dates before minDate will be grayed out. Default = undefined
    minDate: PropTypes.any,
    // Maximum date that can be selected, dates after maxDate will be grayed out. Default = undefined
    maxDate: PropTypes.any,

    // If firstDay=1 week starts from Monday. Note that dayNames and dayNamesShort should still start from Sunday.
    firstDay: PropTypes.number,

    // Date marking style [simple/period/multi-dot/multi-period]. Default = 'simple'
    markingType: PropTypes.string,

    // Hide month navigation arrows. Default = false
    hideArrows: PropTypes.bool,
    // Display loading indicador. Default = false
    displayLoadingIndicator: PropTypes.bool,
    // Do not show days of other months in month page. Default = false
    hideExtraDays: PropTypes.bool,

    // Handler which gets executed on day press. Default = undefined
    onDayPress: PropTypes.func,
    // Handler which gets executed on day long press. Default = undefined
    onDayLongPress: PropTypes.func,
    // Handler which gets executed when visible month changes in calendar. Default = undefined
    onMonthChange: PropTypes.func,
    onVisibleMonthsChange: PropTypes.func,
    // Replace default arrows with custom ones (direction can be 'left' or 'right')
    renderArrow: PropTypes.func,
    // Provide custom day rendering component
    dayComponent: PropTypes.any,
    // Month format in calendar title. Formatting values: http://arshaw.com/xdate/#Formatting
    monthFormat: PropTypes.string,
    // Disables changing month when click on days of other months (when hideExtraDays is false). Default = false
    disableMonthChange: PropTypes.bool,
    //  Hide day names. Default = false
    hideDayNames: PropTypes.bool,
    // Disable days by default. Default = false
    disabledByDefault: PropTypes.bool,
    // Show week numbers. Default = false
    showWeekNumbers: PropTypes.bool,
    // Handler which gets executed when press arrow icon left. It receive a callback can go back month
    onPressArrowLeft: PropTypes.func,
    // Handler which gets executed when press arrow icon left. It receive a callback can go next month
    onPressArrowRight: PropTypes.func,
    // 日历展示宽度
    calendarWidth: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.style = styleConstructor(this.props.theme);
    let currentMonth;
    if (props.current) {
      minMonth=parseDate(props.current)
      currentMonth = [
        parseDate(props.current).addMonths(-1),
        parseDate(props.current),
        parseDate(props.current).addMonths(1),
      ];
    } else {
      minMonth=XDate()
      currentMonth = [
        XDate().addMonths(-1),
        XDate(),
        XDate().addMonths(1),
      ];
    }
    this.state = {
      currentMonth,
      minMonth
    };

  }

  componentWillUpdate(nextProps, nextState) {
    const current= parseDate(this.props.current).clone();
    const nextCurrentMonth= parseDate(nextState.currentMonth);
    const currentDateString = nextState.currentMonth[1].toString('yyyy MM')
    const minDateString = this.state.currentMonth[1].toString('yyyy MM')

    if (nextCurrentMonth !== this.state.currentMonth && currentDateString !== minDateString) {

      const currentSelectDay = nextState.currentMonth[1].clone().setDate(current.getDate())

      while (currentSelectDay.getMonth() !== nextState.currentMonth[1].clone().getMonth()) {
        currentSelectDay.addDays(-1)
      }
      this._handleDayInteraction(currentSelectDay, this.props.onDayPress);
    }
  }

  selectChangeMonth = (day) => {
    const dateString = day.toString('yyyy MM');
    const minDateString = this.state.currentMonth[1].toString('yyyy MM')

    if (dateString > minDateString) {
      this.scrollChangeMonth(this.props.calendarWidth + 1)
    } else if (dateString < minDateString) {
      this.scrollChangeMonth(this.props.calendarWidth - 1)
    }
  }

  scrollChangeMonth = (event) => {
    const scrollX = event.nativeEvent ? event.nativeEvent.contentOffset.x : event;
    let newMonth = [];
    this.state.currentMonth.map((value) =>
      newMonth.push(value.clone())
    );
    const currentDate = this.state.currentMonth[1].clone()

    if(scrollX > this.props.calendarWidth) {
      const newDate = currentDate.addMonths(2).clone()
      newMonth.push(newDate)
      newMonth.shift()
      this.setState({
        currentMonth: newMonth,
      })
    } else if (scrollX < this.props.calendarWidth) {
      if (this.state.currentMonth[0].toString('yyyy MM') < this.state.minMonth.toString('yyyy MM')) {
        this.scrollView.scrollTo({ x: this.props.calendarWidth, y: 0, animated: true })
        return null;
      }
      const newDate = currentDate.addMonths(-2).clone()
      newMonth.unshift(newDate)
      newMonth.pop()
      this.setState({
        currentMonth: newMonth,
      })
    }
    this.scrollView.scrollTo({ x: this.props.calendarWidth, y: 0, animated:false })
  }

  _handleDayInteraction(date, interaction) {
    const day = parseDate(date);
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    if (!(minDate && !dateutils.isGTE(day, minDate)) && !(maxDate && !dateutils.isLTE(day, maxDate))) {
      const shouldUpdateMonth = this.props.disableMonthChange === undefined || !this.props.disableMonthChange;
      if (shouldUpdateMonth) {
        this.selectChangeMonth(day);
      }
      if (interaction) {
        interaction(xdateToData(day));
      }
    }
  }

  pressDay = (date) => {
    this._handleDayInteraction(date, this.props.onDayPress);
  }

  longPressDay = (date) => {
    this._handleDayInteraction(date, this.props.onDayLongPress);
  }

  addMonth = (count) => {
    if (count > 0) {
      this.scrollChangeMonth(this.props.calendarWidth + 1)
    } else {
      this.scrollChangeMonth(this.props.calendarWidth - 1)
    }
  }

  renderDay(day, id, month) {
    const minDate = parseDate(this.props.minDate);
    const maxDate = parseDate(this.props.maxDate);
    let state = '';
    if (this.props.disabledByDefault) {
      state = 'disabled';
    } else if ((minDate && !dateutils.isGTE(day, minDate)) || (maxDate && !dateutils.isLTE(day, maxDate))) {
      state = 'disabled';
    } else if (!dateutils.sameMonth(day, month)) {
      state = 'disabled';
    } else if (dateutils.sameDate(day, XDate())) {
      state = 'today';
    }
    let dayComp;
    if (!dateutils.sameMonth(day, month) && this.props.hideExtraDays) {
      if (['period', 'multi-period'].includes(this.props.markingType)) {
        dayComp = (<View key={id} style={{flex: 1}}/>);
      } else {
        dayComp = (<View key={id} style={this.style.dayContainer}/>);
      }
    } else {
      const DayComp = this.getDayComponent();
      const date = day.getDate();
      dayComp = (
        <DayComp
          key={id}
          state={state}
          theme={this.props.theme}
          onPress={this.pressDay}
          onLongPress={this.longPressDay}
          date={xdateToData(day)}
          marking={this.getDateMarking(day)}
        >
          {date}
        </DayComp>
      );
    }
    return dayComp;
  }

  getDayComponent() {
    if (this.props.dayComponent) {
      return this.props.dayComponent;
    }

    switch (this.props.markingType) {
    case 'period':
      return UnitDay;
    case 'multi-dot':
      return MultiDotDay;
    case 'multi-period':
      return MultiPeriodDay;
    case 'custom':
      return SingleDay;
    default:
      return Day;
    }
  }

  getDateMarking(day) {
    if (!this.props.markedDates) {
      return false;
    }
    const dates = this.props.markedDates[day.toString('yyyy-MM-dd')] || EmptyArray;
    if (dates.length || dates) {
      return dates;
    } else {
      return false;
    }
  }

  renderWeekNumber (weekNumber) {
    return <Day key={`week-${weekNumber}`} theme={this.props.theme} marking={{disableTouchEvent: true}} state='disabled'>{weekNumber}</Day>;
  }

  renderWeek(days, id, month) {
    const week = [];
    days.forEach((day, id2) => {
      week.push(this.renderDay(day, id2, month));
    }, this);

    if (this.props.showWeekNumbers) {
      week.unshift(this.renderWeekNumber(days[days.length - 1].getWeek()));
    }

    return (<View style={this.style.week} key={id}>{week}</View>);
  }

  render() {
    let showMonthWeeks = [];
    let indicator;
    this.state.currentMonth.map((month, index) => {
      const days = dateutils.page(month, this.props.firstDay);
      const weeks = [];
      while (days.length) {
        weeks.push(this.renderWeek(days.splice(0, 7), weeks.length, month));
      }
      const current = parseDate(this.props.current);
      if (current) {
        const lastMonthOfDay = current.clone().addMonths(1, true).setDate(1).addDays(-1).toString('yyyy-MM-dd');
        if (this.props.displayLoadingIndicator &&
            !(this.props.markedDates && this.props.markedDates[lastMonthOfDay])) {
          indicator = true;
        }
      }
      showMonthWeeks = [...showMonthWeeks, weeks]
    })

    return (
      <View style={[this.style.container, this.props.style]}>
        <CalendarHeader
          theme={this.props.theme}
          hideArrows={this.props.hideArrows}
          month={this.state.currentMonth[1]}
          addMonth={this.addMonth}
          showIndicator={indicator}
          firstDay={this.props.firstDay}
          renderArrow={this.props.renderArrow}
          monthFormat={this.props.monthFormat}
          hideDayNames={this.props.hideDayNames}
          weekNumbers={this.props.showWeekNumbers}
          onPressArrowLeft={this.props.onPressArrowLeft}
          onPressArrowRight={this.props.onPressArrowRight}
        />
        <ScrollView
          ref={(c) => this.scrollView = c }
          horizontal
          pagingEnabled
          style={{ width: this.props.calendarWidth }}
          contentOffset={{ x: this.props.calendarWidth, y:0 }}
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={this.scrollChangeMonth}
        >
          {showMonthWeeks.map((value, index) => (
              <View key={index} style={this.style.monthView}>
                {value}
              </View>
            ))
          }
        </ScrollView>
      </View>);
  }
}

export default Calendar;
