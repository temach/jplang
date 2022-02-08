module Main exposing (..)

import Browser exposing (Document)
import Css
import Debug exposing (log)
import Dict exposing (Dict)
import Html exposing (Attribute, Html, button, div, input, li, ol, span, text)
import Html.Attributes exposing (attribute, placeholder, style, value)
import Html.Events exposing (on, onClick, onInput)
import Html.Events.Extra exposing (targetValueIntParse)
import Http
import Json.Decode as Decode
import Json.Encode as Encode
import List.Extra
import Platform.Cmd as Cmd
import Url.Builder exposing (absolute)



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
    { currentWork : WorkElement
    , workElements : List WorkElement
    , currentWorkIndex : Int
    , currentHighlightWorkElementIndex : Int
    }


init : () -> ( Model, Cmd Msg )
init _ =
    let
        model =
            { currentWork = { kanji = "", keyword = "", notes = "" }
            , workElements = [ WorkElement "a" "first" "", WorkElement "b" "second" "asd", WorkElement "c" "third" "" ]

            -- , workElements = []
            , currentWorkIndex = -1
            , currentHighlightWorkElementIndex = -1
            }
    in
    -- update NextWorkElement model
    -- ( model, getWorkElements )
    ( model, Cmd.none )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    Sub.none



-- UPDATE


type Msg
    = UpdateWorkElement WorkElement
    | NextWorkElement
    | SelectWorkElement Int
    | WorkElementsReady (Result Http.Error (List WorkElement))
    | HighlightWorkElement Int
    | UnHighlightWorkElement Int


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UpdateWorkElement newElement ->
            let
                newWorkElements =
                    List.Extra.setAt model.currentWorkIndex newElement model.workElements

                newModel =
                    { model | workElements = newWorkElements }
            in
            -- after updating the element, move to next work element
            update NextWorkElement newModel

        NextWorkElement ->
            update (SelectWorkElement (model.currentWorkIndex + 1)) model

        SelectWorkElement index ->
            let
                selected =
                    Maybe.withDefault
                        (WorkElement "X" "Error" "An error occurred")
                        (List.Extra.getAt index model.workElements)

                newModel =
                    { model | currentWorkIndex = index, currentWork = selected }
            in
            ( newModel, Cmd.none )

        HighlightWorkElement index ->
            ( { model | currentHighlightWorkElementIndex = index }, Cmd.none )

        UnHighlightWorkElement index ->
            if model.currentHighlightWorkElementIndex == index then
                ( { model | currentHighlightWorkElementIndex = -1 }, Cmd.none )

            else
                ( model, Cmd.none )

        WorkElementsReady result ->
            case result of
                Ok elements ->
                    let
                        newModel =
                            { model | workElements = elements }
                    in
                    update NextWorkElement newModel

                Err message ->
                    ( model, Cmd.none )


getWorkElements : Cmd Msg
getWorkElements =
    Http.get
        { url = absolute [ "api", "work" ] []
        , expect = Http.expectJson WorkElementsReady workElementsDecoder
        }


workElementsDecoder : Decode.Decoder (List WorkElement)
workElementsDecoder =
    Decode.list
        (Decode.map3 WorkElement
            (Decode.index 0 Decode.string)
            (Decode.index 1 Decode.string)
            (Decode.index 2 Decode.string)
        )


workElementEncoder : Model -> Encode.Value
workElementEncoder model =
    let
        selected =
            Maybe.withDefault
                (WorkElement "X" "Error" "An error occurred")
                (List.Extra.getAt model.currentWorkIndex model.workElements)
    in
    Encode.object
        [ ( "kanji", Encode.string selected.kanji )
        , ( "keyword", Encode.string selected.keyword )
        , ( "notes", Encode.string selected.notes )
        ]



-- VIEW


view : Model -> Document Msg
view model =
    Document "Kanji" [ render model ]


renderSingleWorkElement : Model -> Int -> WorkElement -> Html Msg
renderSingleWorkElement model index elem =
    div
        [ style "padding" "2px 0"
        , style "display" "flex"
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            , on "mouseenter" (Decode.map HighlightWorkElement targetValueIntParse)
            , on "mouseleave" (Decode.map UnHighlightWorkElement targetValueIntParse)
            , if model.currentHighlightWorkElementIndex == index then
                style "background-color" "rgb(200, 250, 200)"

              else
                style "background-color" ""
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "flex" "0 0 auto"
            , style "margin" "0 0.5rem"
            , if model.currentHighlightWorkElementIndex == index then
                style "background-color" "rgb(210, 250, 200)"

              else
                style "background-color" "rgb(210, 200, 200)"
            ]
            [ text elem.kanji ]
        , span
            [ style "flex" "1 0 4rem"
            , style "margin" "0 0.5rem"
            , if String.length elem.keyword > 0 then
                style "background-color" "rgb(200, 210, 200)"

              else
                style "background-color" ""
            ]
            [ text elem.keyword ]
        , span
            [ style "flex" "10 1 auto"
            , if String.length elem.notes > 0 then
                style "background-color" "rgb(200, 200, 210)"

              else
                style "background-color" ""
            ]
            [ text elem.notes ]
        ]


renderWorkElements : Model -> Html Msg
renderWorkElements model =
    let
        partial =
            renderSingleWorkElement model
    in
    div
        [ on "click" (Decode.map SelectWorkElement targetValueIntParse)
        ]
        (List.indexedMap partial model.workElements)


render : Model -> Html Msg
render model =
    -- Select one of the WorkElements
    div
        [ style "background-color" "rgb(210, 210, 210)"
        , style "overflow" "auto"
        ]
        [ div [] [ text "Work Elements" ]
        , renderWorkElements model
        ]
