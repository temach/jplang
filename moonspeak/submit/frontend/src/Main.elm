port module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Http
import Json.Decode as D
import Json.Encode as E
import List.Extra exposing (getAt)
import Platform.Cmd as Cmd
import Url.Builder exposing (relative)



-- MAIN


main : Program () Model Msg
main =
    Browser.document
        { init = init
        , subscriptions = subscriptions
        , update = update
        , view = view
        }



-- MODEL


type alias KeyCandidate =
    { word : String
    , metadata : String
    , freq : List Int
    }


type alias Frequency =
    List Int


type alias Model =
    { kanji : String
    , keyword : String
    , notes : String
    , freq : List Int
    , userMessage : Dict String String
    , history : List String
    }


defaultModel =
    { kanji = "X"
    , keyword = "loading..."
    , notes = "loading notes..."
    , freq = []
    , userMessage = Dict.empty
    , history = []
    }


init : () -> ( Model, Cmd Msg )
init _ =
    ( defaultModel, Cmd.none )



-- PORTS


port sendMessage : E.Value -> Cmd msg


port messageReceiver : (D.Value -> msg) -> Sub msg



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch [ messageReceiver Recv ]


portEncoder : Model -> E.Value
portEncoder model =
    E.object
        [ ( "kanji", E.string model.kanji )
        , ( "keyword", E.string model.keyword )
        , ( "notes", E.string model.notes )
        ]


type alias MsgDecoded =
    { keyword : Maybe String, kanji : Maybe String, notes : Maybe String }


portDecoder : D.Decoder MsgDecoded
portDecoder =
    D.map3 MsgDecoded
        (D.maybe (D.field "keyword" D.string))
        (D.maybe (D.field "kanji" D.string))
        (D.maybe (D.field "notes" D.string))



-- UPDATE


type Msg
    = KeywordInput String
    | NotesInput String
    | KeywordSubmitClick
      -- Http responses
    | KeywordSubmitReady (Result Http.Error String)
    | KeywordCheckReady (Result Http.Error KeyCandidate)
      -- ports
    | Recv D.Value


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        KeywordSubmitClick ->
            if String.length model.keyword > 0 then
                ( model, submitKeyword model )

            else
                ( { model | userMessage = Dict.insert "KeywordSubmitClick" "Error: keyword length must be non-zero" model.userMessage }, Cmd.none )

        KeywordSubmitReady result ->
            case result of
                Ok body ->
                    if String.length body > 0 then
                        ( { model | userMessage = Dict.insert "KeywordSubmitReady" ("Error submitting keyword. Details:" ++ body) model.userMessage }, Cmd.none )

                    else
                        ( { model | userMessage = Dict.empty }, sendMessage (portEncoder model) )

                Err _ ->
                    ( { model | userMessage = Dict.insert "KeywordSubmitReady" "Error submitting keyword. Details unknown." model.userMessage }, Cmd.none )

        KeywordInput word ->
            let
                newCandidateHistory =
                    model.history ++ [ model.keyword ]

                newModel =
                    { model
                        | keyword = word
                        , history = historyFilter newCandidateHistory
                    }
            in
            if String.length word >= 2 then
                ( newModel, getKeywordCheck newModel.kanji word )

            else
                ( { newModel | freq = [], userMessage = Dict.empty }, Cmd.none )

        NotesInput word ->
            ( { model | notes = word }, Cmd.none )

        KeywordCheckReady result ->
            case result of
                Ok elem ->
                    ( { model | freq = elem.freq, userMessage = Dict.insert "KeywordCheckReady" elem.metadata model.userMessage }, Cmd.none )

                Err _ ->
                    ( { model | freq = [], userMessage = Dict.insert "KeywordCheckReady" "Error getting keyword frequency" model.userMessage }, Cmd.none )

        Recv jsonValue ->
            case D.decodeValue portDecoder jsonValue of
                Ok value ->
                    let
                        newKeyword =
                            case value.keyword of
                                Just str ->
                                    str

                                Nothing ->
                                    model.keyword

                        newKanji =
                            case value.kanji of
                                Just str ->
                                    str

                                Nothing ->
                                    model.kanji

                        newNotes =
                            case value.notes of
                                Just str ->
                                    str

                                Nothing ->
                                    model.notes

                        newModel =
                            { model | keyword = newKeyword, kanji = newKanji, notes = newNotes }
                    in
                    update (KeywordInput newKeyword) newModel

                Err _ ->
                    ( model, Cmd.none )


uniq : List a -> List a
uniq list =
    case list of
        [] ->
            []

        [ a ] ->
            [ a ]

        a :: b :: more ->
            if a == b then
                uniq (a :: more)

            else
                a :: uniq (b :: more)


historyFilter : List String -> List String
historyFilter list =
    uniq (List.filter (\x -> String.length x >= 2) list)


getKeywordCheck : String -> String -> Cmd Msg
getKeywordCheck kanji keyword =
    Http.get
        { url = relative [ "api", "keywordcheck/" ++ kanji ++ "/" ++ keyword ] []
        , expect = Http.expectJson KeywordCheckReady keyCandidateDecoder
        }


keyCandidateDecoder : D.Decoder KeyCandidate
keyCandidateDecoder =
    D.map3 KeyCandidate
        (D.field "word" D.string)
        (D.field "metadata" D.string)
        (D.field "freq" (D.list D.int))


submitKeyword : Model -> Cmd Msg
submitKeyword model =
    Http.post
        { url = relative [ "api", "submit" ] []
        , body = Http.jsonBody (submitKeywordEncoder model)
        , expect = Http.expectString KeywordSubmitReady
        }


submitKeywordEncoder : Model -> E.Value
submitKeywordEncoder model =
    E.object
        [ ( "kanji", E.string model.kanji )
        , ( "keyword", E.string model.keyword )
        , ( "notes", E.string model.notes )
        ]



-- VIEW


view : Model -> Document Msg
view model =
    Document "Kanji" [ render model ]


renderUserMessages : Model -> Html Msg
renderUserMessages model =
    div [] [ text (String.join "!" (Dict.values model.userMessage)) ]


renderSubmitBar : Model -> Html Msg
renderSubmitBar model =
    div [ style "display" "flex" ]
        [ span
            [ style "flex" "1 0 auto" ]
            [ text model.kanji ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "Keyword"
                , value model.keyword
                , onInput KeywordInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        , span
            [ style "flex" "1 0 auto" ]
            [ text ("Corpus: " ++ (String.fromInt <| Maybe.withDefault 0 <| getAt 0 model.freq)) ]
        , span
            [ style "flex" "1 0 auto" ]
            [ text ("Subs: " ++ (String.fromInt <| Maybe.withDefault 0 <| getAt 1 model.freq)) ]
        , span
            [ style "flex" "1 0 auto" ]
            [ button [ onClick KeywordSubmitClick ] [ text "Submit" ] ]
        , span
            [ style "flex" "10 0 70px" ]
            [ input
                [ placeholder "Notes"
                , value model.notes
                , onInput NotesInput
                , style "width" "100%"
                , style "box-sizing" "border-box"
                ]
                []
            ]
        ]


render : Model -> Html Msg
render model =
    -- Keyword submit
    div
        [ style "background-color" "rgb(250, 250, 250)"
        , style "overflow" "auto"
        ]
        [ renderUserMessages model
        , renderSubmitBar model
        ]
