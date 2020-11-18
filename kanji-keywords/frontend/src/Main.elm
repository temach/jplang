module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Html exposing (Attribute, Html, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Http
import Json.Decode as Decode
import Json.Encode as Encode



-- MAIN


main =
    Browser.document
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }



-- MODEL


type alias WorkElement =
    { kanji : String
    , keyword : String
    , notes : String
    }


type alias Model =
    { kanji : String
    , keyword : String
    , notes : String
    , freq : List Int
    , work : List WorkElement
    , currentWork : Int
    , userMessage : String
    }


init : () -> ( Model, Cmd Msg )
init _ =
    let
        model =
            { kanji = ""
            , keyword = "loading..."
            , notes = ""
            , freq = []

            -- , work = [ WorkElement "a" "first" "", WorkElement "b" "second" "asd", WorkElement "c" "third" "" ]
            , work = []
            , currentWork = -1
            , userMessage = ""
            }
    in
    -- update NextWorkElement model
    ( model, getWorkElements )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- UPDATE


type Msg
    = NextWorkElement
    | SubmitKeywordClick
    | SelectWorkElement Int
    | KeywordInput String
    | NotesInput String
    | GotWorkElements (Result Http.Error (List WorkElement))
    | GotKeywordFrequency (Result Http.Error (List Int))
    | PostedKeyword (Result Http.Error String)


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        SubmitKeywordClick ->
            ( model, submitKeyword model )

        PostedKeyword result ->
            case result of
                Ok body ->
                    let
                        newElement =
                            { kanji = model.kanji
                            , keyword = model.keyword
                            , notes = model.notes
                            }

                        newWork =
                            updateWorkElement model.currentWork newElement model.work

                        newModel =
                            { model | work = newWork }
                    in
                    update NextWorkElement { newModel | userMessage = body }

                Err _ ->
                    ( { model | userMessage = "Error submitting keyword. Details unknown." }, Cmd.none )

        NextWorkElement ->
            let
                newModel =
                    chooseWorkElement (model.currentWork + 1) model
            in
            if String.length newModel.keyword > 1 then
                ( newModel, getKeywordFrequency newModel.keyword )

            else
                ( newModel, Cmd.none )

        SelectWorkElement index ->
            let
                newModel =
                    chooseWorkElement index model
            in
            if String.length newModel.keyword > 1 then
                ( newModel, getKeywordFrequency newModel.keyword )

            else
                ( newModel, Cmd.none )

        KeywordInput word ->
            if String.length word >= 2 then
                ( { model | keyword = word }, getKeywordFrequency word )

            else
                ( { model | keyword = word }, Cmd.none )

        NotesInput word ->
            ( { model | notes = word }, Cmd.none )

        GotWorkElements result ->
            case result of
                Ok elements ->
                    let
                        newModel =
                            { model | work = elements, userMessage = "" }
                    in
                    update NextWorkElement newModel

                Err _ ->
                    ( { model | userMessage = "Error getting work items" }, Cmd.none )

        GotKeywordFrequency result ->
            case result of
                Ok freq ->
                    ( { model | freq = freq, userMessage = "" }, Cmd.none )

                Err _ ->
                    ( { model | userMessage = "Error getting keyword frequency" }, Cmd.none )


chooseWorkElement : Int -> Model -> Model
chooseWorkElement index model =
    let
        selected =
            get index model.work
    in
    { model
        | currentWork = index
        , kanji = selected.kanji
        , keyword = selected.keyword
        , notes = selected.notes
    }


updateWorkElement : Int -> WorkElement -> List WorkElement -> List WorkElement
updateWorkElement index newElement list =
    let
        updator i elem =
            if i == index then
                newElement

            else
                elem
    in
    List.indexedMap updator list


keywordFrequencyRender : Model -> String
keywordFrequencyRender model =
    let
        maybeCorpus =
            List.head model.freq

        maybeSubs =
            List.head (List.drop 1 model.freq)
    in
    case ( maybeCorpus, maybeSubs ) of
        ( Just c, Just s ) ->
            "Corpus: " ++ String.fromInt c ++ " Subs: " ++ String.fromInt s

        _ ->
            "Frequency unknown"


get : Int -> List WorkElement -> WorkElement
get index list =
    let
        maybeElement =
            List.head (List.drop index list)
    in
    case maybeElement of
        Just elem ->
            elem

        Nothing ->
            WorkElement "X" "Error" "An error occurred"


getWorkElements : Cmd Msg
getWorkElements =
    Http.get
        { url = "http://localhost:9000/api/work"
        , expect = Http.expectJson GotWorkElements workElementsDecoder
        }


workElementsDecoder : Decode.Decoder (List WorkElement)
workElementsDecoder =
    Decode.list
        (Decode.map3 WorkElement
            (Decode.index 0 Decode.string)
            (Decode.index 1 Decode.string)
            (Decode.index 2 Decode.string)
        )


getKeywordFrequency : String -> Cmd Msg
getKeywordFrequency keyword =
    Http.get
        { url = "http://localhost:9000/api/frequency/" ++ keyword
        , expect = Http.expectJson GotKeywordFrequency keywordFrequencyDecoder
        }


keywordFrequencyDecoder : Decode.Decoder (List Int)
keywordFrequencyDecoder =
    Decode.list Decode.int


submitKeywordEncoder : Model -> Encode.Value
submitKeywordEncoder model =
    Encode.object
        [ ( "kanji", Encode.string model.kanji )
        , ( "keyword", Encode.string model.keyword )
        , ( "notes", Encode.string model.notes )
        ]


submitKeyword : Model -> Cmd Msg
submitKeyword model =
    Http.post
        { url = "http://localhost:9000/api/submit"
        , body = Http.jsonBody (submitKeywordEncoder model)
        , expect = Http.expectString PostedKeyword
        }



-- VIEW


view : Model -> Document Msg
view model =
    Document "Kanji" [ render model ]


renderSingleWorkElement : Int -> WorkElement -> Html Msg
renderSingleWorkElement index elem =
    div
        [ style "padding" "2px 0"
        ]
        [ span
            [ style "display" "inline-block"
            , style "width" "45px"
            , value (String.fromInt index)
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "padding" "0 10px 0 0"
            , style "background-color" "rgb(210, 200, 200)"
            ]
            [ text elem.kanji ]
        , span
            [ style "display" "inline-block"
            , style "width" "120px"
            , style "background-color" "rgb(200, 210, 200)"
            ]
            [ text elem.keyword ]
        , span
            [ style "display" "inline-block"
            , style "min-width" "150px"
            , style "background-color" "rgb(200, 200, 210)"
            ]
            [ text elem.notes ]
        ]


renderWorkElements : Model -> Html Msg
renderWorkElements model =
    div
        [ style "display" "inline-block"
        , style "height" "500px"
        , style "overflow" "scroll"
        , on "click" (Decode.map SelectWorkElement targetValueIntParse)
        ]
        (List.indexedMap renderSingleWorkElement model.work)


render : Model -> Html Msg
render model =
    div []
        [ div
            [ style "background-color" "rgb(230, 230, 230)"
            ]
            [ div [] [ text model.userMessage ]
            , span [] [ text (" " ++ model.kanji ++ " ") ]
            , span [] [ input [ placeholder "Keyword", value model.keyword, onInput KeywordInput ] [] ]
            , span [] [ text (" " ++ keywordFrequencyRender model ++ " ") ]
            , span [] [ button [ onClick SubmitKeywordClick ] [ text "Submit" ] ]
            , span [] [ input [ placeholder "Notes", value model.notes, onInput NotesInput ] [] ]
            ]
        , div
            [ style "background-color" "rgb(210, 210, 210)"
            , style "display" "inline-block"
            ]
            [ div [] [ text "Work Elements Progress" ]
            , div [] [ renderWorkElements model ]
            ]
        ]
