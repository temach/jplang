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
import Json.Decode as D
import Json.Encode as E
import List.Extra
import Platform.Cmd as Cmd
import Url.Builder exposing (relative)



-- PORTS


port sendMessage : E.Value -> Cmd msg


port messageReceiver : (D.Value -> msg) -> Sub msg



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


defaultCurrentWork =
    WorkElement "" "" ""


brokenCurrentWork =
    WorkElement "X" "Error" "An error occurred"


defaultModel =
    { currentWork = defaultCurrentWork
    , workElements = []
    , currentWorkIndex = -1
    , currentHighlightWorkElementIndex = -1
    }


defaultModelTwo =
    { defaultModel | workElements = [ WorkElement "a" "first" "", WorkElement "b" "" "asd", WorkElement "c" "third" "and comment" ] }


init : () -> ( Model, Cmd Msg )
init _ =
    -- update NextWorkElement model
    -- ( model, Cmd.none )
    ( defaultModel, getWorkElements )



-- SUBSCRIPTIONS


subscriptions : Model -> Sub Msg
subscriptions _ =
    messageReceiver Recv


portEncoder : WorkElement -> E.Value
portEncoder elem =
    E.object
        [ ( "kanji", E.string elem.kanji )
        , ( "keyword", E.string elem.keyword )
        , ( "notes", E.string elem.notes )
        ]


type alias MsgDecoded =
    { keyword : String, kanji : String, notes : String }


portDecoder : D.Decoder MsgDecoded
portDecoder =
    D.map3 MsgDecoded
        (D.field "keyword" D.string)
        (D.field "kanji" D.string)
        (D.field "notes" D.string)



-- UPDATE


type Msg
    = UpdateWorkElement WorkElement
    | NextWorkElement
    | SelectWorkElement Int
    | WorkElementsReady (Result Http.Error (List WorkElement))
      -- ports
    | Recv D.Value


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
            ( newModel, sendMessage (portEncoder newModel.currentWork) )

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

        Recv jsonValue ->
            case D.decodeValue portDecoder jsonValue of
                Ok value ->
                    let
                        newElement =
                            WorkElement value.kanji value.keyword value.notes
                    in
                    update (UpdateWorkElement newElement) model

                Err _ ->
                    update (UpdateWorkElement defaultModel.currentWork) defaultModel


getWorkElements : Cmd Msg
getWorkElements =
    Http.get
        { url = relative [ "api", "work" ] []
        , expect = Http.expectJson WorkElementsReady workElementsDecoder
        }


workElementsDecoder : D.Decoder (List WorkElement)
workElementsDecoder =
    D.list
        (D.map3 WorkElement
            (D.index 0 D.string)
            (D.index 1 D.string)
            (D.index 2 D.string)
        )


workElementEncoder : Model -> E.Value
workElementEncoder model =
    let
        selected =
            Maybe.withDefault
                (WorkElement "X" "Error" "An error occurred")
                (List.Extra.getAt model.currentWorkIndex model.workElements)
    in
    E.object
        [ ( "kanji", E.string selected.kanji )
        , ( "keyword", E.string selected.keyword )
        , ( "notes", E.string selected.notes )
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
        , class "row"
        ]
        [ span
            [ style "flex" "0 0 1.5rem"
            , value (String.fromInt index)
            ]
            [ text (String.fromInt index ++ ".") ]
        , span
            [ style "flex" "0 0 auto"
            , style "margin" "0 0.5rem"
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
        [ on "click" (D.map SelectWorkElement targetValueIntParse)
        ]
        (List.indexedMap partial model.workElements)


render : Model -> Html Msg
render model =
    div
        [ style "background-color" "rgb(210, 210, 210)"
        , style "overflow" "auto"
        ]
        [ div [] [ text "Work Elements" ]
        , renderWorkElements model
        ]
