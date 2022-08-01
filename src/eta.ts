export interface IEtaFormat {
    done: number;
    total: number;
    elapsed: number;
    estimated: number;
    rate: string;
    fraction: string;
    etaSeconds: string;
    etaHumanized: string;
    text?: string;
}

const validFields = new Set<keyof IEtaFormat>(['done', 'total', 'elapsed', 'estimated', 'rate', 'fraction', 'etaSeconds', 'etaHumanized', 'text']);
const isValidEtaFormatKey = (key: string): key is keyof IEtaFormat => validFields.has(key as keyof IEtaFormat);

export class ETA {
    protected total: number;
    protected done: number = 0;
    protected startedAt: number;
    protected lastText?: string;

    public constructor(total: number) {
        this.total = total;
        this.done = 0;
        this.startedAt = Date.now();

        this.tick = this.tick.bind(this);
    }

    public tick(text?: string): this {
        this.done++;

        if (text) {
            this.lastText = text;
        }

        return this;
    }

    public format(layout: string): string;
    public format<T>(layout: (props: IEtaFormat) => T): T;
    public format(layout: string | (<T>(props: IEtaFormat) => T)) {
        // start ... now (seconds)
        const elapsed = (Date.now() - this.startedAt) / 1000;

        // current iterations per second
        const rate = this.done / elapsed;

        // start ... end (seconds, approx)
        const estimated = this.total / rate;

        // now ... end (seconds, approx)
        const eta = estimated - elapsed;

        const fields: IEtaFormat = {
            done: this.done,
            total: this.total,
            elapsed,
            estimated,
            rate: rate.toPrecision(4),
            fraction: (this.done / this.total).toPrecision(2),
            etaSeconds: eta.toPrecision(4),
            etaHumanized: this._formatTime(eta),
            text: this.lastText,
        };

        return typeof layout === 'string'
            ? layout.replace(/{{(\S+?)}}/g, (_all: string, key: string) => {
                if (!isValidEtaFormatKey(key)) return '';
                const value = fields[key];
                if (value === undefined) return '';
                return String(value);
            })
            : layout(fields);
    };

    protected _formatTime(seconds: number): string {
        let result = '';

        if (seconds >= 86400) {
            const mo = Math.floor(seconds / 86400 % 60);
            result += ` ${mo}mo`;
        }

        if (seconds >= 3600) {
            const h = Math.floor(seconds / 3600 % 60);
            result += ` ${h}h`;
        }

        if (seconds >= 60) {
            const m = Math.floor(seconds / 60 % 60);
            result += ` ${m}m`;
        }

        result += ` ${Math.floor(seconds % 60)}s`;

		return result.trim();
    }
}
