port module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, class, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import List.Extra exposing (getAt)
import Platform.Cmd as Cmd
import Url.Builder exposing (relative)



-- MAIN


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
    , userMessage : Dict String String
    , suggestions : List KeyCandidate
    }


defaultModel =
    { kanji = "X"
    , keyword = "loading..."
    , userMessage = Dict.empty
    , suggestions = []
    }


init : () -> ( Model, Cmd Msg )
init _ =
    -- update NextWorkElement model
    ( defaultModel, Cmd.none )



-- PORTS


port sendMessage : Encode.Value -> Cmd msg


port messageReceiver : (Decode.Value -> msg) -> Sub msg



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch [ messageReceiver Recv ]


portEncoder : Model -> Encode.Value
portEncoder model =
    Encode.object
        [ ( "keyword", Encode.string model.keyword )
        ]


type alias MsgDecoded =
    { kanji : String }


portDecoder : Decode.Decoder MsgDecoded
portDecoder =
    Decode.map MsgDecoded
        (Decode.field "kanji" Decode.string)



-- UPDATE


type
    Msg
    -- suggestions
    = SelectSuggestion Int
    | SortSuggestionsByFreq
    | SortSuggestionsByOrigin
      -- Http responses
    | SuggestionsReady (Result Http.Error (List KeyCandidate))
      -- ports
    | Recv Decode.Value


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        SelectSuggestion index ->
            let
                newSuggestion =
                    Maybe.withDefault (KeyCandidate "Error" "Error" [ 0 ]) (getAt index model.suggestions)

                newModel =
                    { model | keyword = newSuggestion.word }
            in
            ( newModel, sendMessage (portEncoder newModel) )

        SortSuggestionsByFreq ->
            ( { model | suggestions = List.reverse (List.sortWith compareKeyCandidates model.suggestions) }, Cmd.none )

        SortSuggestionsByOrigin ->
            ( { model | suggestions = List.sortBy .metadata model.suggestions }, Cmd.none )

        SuggestionsReady result ->
            case result of
                Ok suggestions ->
                    let
                        newModel =
                            { model | suggestions = suggestions }
                    in
                    update SortSuggestionsByFreq newModel

                Err _ ->
                    ( { model | userMessage = Dict.insert "SuggestionsReady" "Error getting keyword suggestions" model.userMessage }, Cmd.none )

        Recv jsonValue ->
            case Decode.decodeValue portDecoder jsonValue of
                Ok value ->
                    if value.kanji == model.kanji then
                        ( model, Cmd.none )

                    else
                        let
                            newKanji =
                                if String.length value.kanji > 0 then
                                    value.kanji

                                else
                                    model.kanji

                            newModel =
                                { model | kanji = newKanji }
                        in
                        ( newModel, Cmd.batch [ getSuggestions newModel.kanji ] )

                Err _ ->
                    ( model, Cmd.none )


compareKeyCandidates : KeyCandidate -> KeyCandidate -> Order
compareKeyCandidates a b =
    let
        afreq =
            Maybe.withDefault 0 (getAt 0 a.freq)
                + Maybe.withDefault 0 (getAt 1 a.freq)
                + Maybe.withDefault 0 (getAt 2 a.freq)
                + Maybe.withDefault 0 (getAt 3 a.freq)

        bfreq =
            Maybe.withDefault 0 (getAt 0 b.freq)
                + Maybe.withDefault 0 (getAt 1 b.freq)
                + Maybe.withDefault 0 (getAt 2 b.freq)
                + Maybe.withDefault 0 (getAt 3 b.freq)
    in
    case compare afreq bfreq of
        LT ->
            LT

        EQ ->
            EQ

        GT ->
            GT


keyCandidateDecoder : Decode.Decoder KeyCandidate
keyCandidateDecoder =
    Decode.map3 KeyCandidate
        (Decode.field "word" Decode.string)
        (Decode.field "metadata" Decode.string)
        (Decode.field "freq" (Decode.list Decode.int))


getSuggestions : String -> Cmd Msg
getSuggestions kanji =
    Http.get
        { url = relative [ "api", "suggestions/" ++ kanji ] []
        , expect = Http.expectJson SuggestionsReady suggestionsDecoder
        }


suggestionsDecoder : Decode.Decoder (List KeyCandidate)
suggestionsDecoder =
    Decode.list keyCandidateDecoder



-- VIEW


view : Model -> Document Msg
view model =
    Document "Kanji" [ render model ]


renderSingleSuggestion : Model -> Int -> KeyCandidate -> Html Msg
renderSingleSuggestion model index suggest =
    div
        [ style "padding" "2px 0"
        , style "display" "flex"
        , class "row"
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "flex" "0 0 6rem" ]
            [ text (suggest.metadata ++ ": ") ]
        , span
            [ style "flex" "10 0 6rem" ]
            [ text suggest.word ]
        , span
            [ style "flex" "1 0 3rem" ]
            [ text (String.fromInt <| Maybe.withDefault 0 <| getAt 0 suggest.freq) ]
        , span
            [ style "flex" "1 0 3rem" ]
            [ text (String.fromInt <| Maybe.withDefault 0 <| getAt 1 suggest.freq) ]
        ]


renderSuggestions : Model -> Html Msg
renderSuggestions model =
    let
        partial =
            renderSingleSuggestion model
    in
    div
        [ on "click" (Decode.map SelectSuggestion targetValueIntParse) ]
        (List.indexedMap partial model.suggestions)


renderUserMessages : Model -> Html Msg
renderUserMessages model =
    div [] [ text (String.join "!" (Dict.values model.userMessage)) ]


render : Model -> Html Msg
render model =
    -- Suggestions
    div
        [ style "background-color" "rgb(230, 230, 230)"
        , style "overflow" "auto"
        ]
        [ renderUserMessages model
        , div
            [ style "display" "flex" ]
            [ span
                [ style "flex" "10 0 calc(1.5rem + 6rem + 6rem)"
                , onClick SortSuggestionsByOrigin
                ]
                [ text "Keyword suggestion" ]
            , span
                [ style "flex" "1 0 3rem"
                , onClick SortSuggestionsByFreq
                ]
                [ text "Corpus" ]
            , span
                [ style "flex" "1 0 3rem"
                , onClick SortSuggestionsByFreq
                ]
                [ text "Subs" ]
            ]
        , renderSuggestions model
        ]
