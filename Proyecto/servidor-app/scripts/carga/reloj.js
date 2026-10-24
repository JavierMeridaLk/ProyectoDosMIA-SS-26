const DateReal = Date
let actual = DateReal.now()

const DateSimulada = class Date extends DateReal {
    constructor(...args) {
        if (args.length === 0) super(actual)
        else super(...args)
    }

    static now() {
        return actual
    }
}

globalThis.Date = DateSimulada

export const reloj = {
    fijar(fecha) {
        actual = Math.max(actual, new DateReal(fecha).getTime())
    },
    reiniciar(fecha) {
        actual = new DateReal(fecha).getTime()
    },
    avanzarMinutos(minutos) {
        actual += minutos * 60 * 1000
    },
    ahora() {
        return new DateReal(actual)
    }
}
