from bottle import route, run, static_file, request, response
import json
import os
import utils


@route("/")
def index():
    return static_file("index.html", root="../frontend/")


@route("/submit", method="POST")
def submit():
    dict_of_frequency = {"frequency": {}, "input_type": "", "error": ""}

    if "binaryfile" in request.files:
        user_file = request.files.get("binaryfile").file
        isimagefile = utils.is_image_file(user_file)
        isaudiofile = utils.is_audio_file(user_file)

        if isimagefile:
            utils.catch_errors(
                dict_of_frequency,
                utils.convert_image_file_and_text_return,
                "image",
                user_file,
            )
        elif isaudiofile:
            utils.catch_errors(
                dict_of_frequency, utils.audio_transcribe, "audio", user_file
            )
        else:
            utils.catch_errors(
                dict_of_frequency,
                utils.frequency,
                "text",
                user_file.read().decode("utf-8"),
            )

    else:
        try:
            user_string = request.json["usertext"]
        except UnicodeDecodeError:
            user_string = request.json["usertext"].encode("ISO-8859-1").decode("utf-8")

        isurl = utils.is_url(user_string)
        isimageurl = isurl and utils.is_image_url(user_string)

        if isimageurl:
            utils.catch_errors(
                dict_of_frequency,
                utils.prepare_image_and_text_return,
                "image",
                user_string,
            )
        elif isurl:
            utils.catch_errors(dict_of_frequency, utils.url_parse, "url", user_string)
        else:
            utils.catch_errors(dict_of_frequency, utils.frequency, "text", user_string)

    response.set_header("content-type", "application/json")
    return json.dumps(dict_of_frequency, ensure_ascii=False)


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Feature, run as "python main.py"')

    # "0.0.0.0" and "moonspeak.localhost" break on windows only "localhost" is portable
    parser.add_argument(
        "--host",
        type=str,
        default=os.getenv("MOONSPEAK_HOST", "localhost"),
        help="hostname to bind",
    )

    parser.add_argument(
        "--port",
        type=int,
        default=os.getenv("MOONSPEAK_PORT", 8005),
        help="port number",
    )
    args = parser.parse_args()

    # other
    print("Running bottle server on port {}".format(args.port))
    run(host=args.host, port=args.port)
