// https://github.com/grbl/grbl/wiki/Interfacing-with-Grbl#feedback-messages
class GrblLineParserResultFeedback {
  // * Grbl v0.9
  //   []
  // * Grbl v1.1
  //   [MSG:]
  static parse(line) {
    const r = line.match(/^\[(?:MSG:)?(.+)\]$/);
    if (!r) {
      return null;
    }

    const payload = {
      message: r[1]
    };

    // grblHAL named probe parameters, returned by $#=<parameter>.
    // A value of -1 or N/A means that the corresponding input is unavailable.
    const probeParameter = line.match(/^\[PARAM:(_probe_state|_toolsetter_state|_probe2_state)=(0|1|-1|N\/A)\]$/);
    if (probeParameter) {
      const inputByName = {
        _probe_state: 0,
        _toolsetter_state: 1,
        _probe2_state: 2
      };
      const input = inputByName[probeParameter[1]];
      const value = probeParameter[2];

      payload.probeInput = {
        input,
        available: value === '0' || value === '1',
        triggered: value === '1'
      };
    }

    return {
      type: GrblLineParserResultFeedback,
      payload: payload
    };
  }
}

export default GrblLineParserResultFeedback;
