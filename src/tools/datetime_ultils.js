import moment from 'moment';
import 'moment-timezone';

export default {
    formatDateTime(timestamp, format = 'DD/MM/YYYY HH:mm:ss') {
        try {
            const ts = moment.unix(timestamp).isValid() ? timestamp * 1000 : timestamp;

            const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            return moment(ts)
                .tz(userTimeZone)
                .format(format);
        } catch (error) {
            console.error('Format error:', error);
            return 'Invalid date';
        }
    }
}